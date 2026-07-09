'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import type { AppRole } from '@/lib/auth/access';

/**
 * announcements' SELECT RLS policy (current_user_can_read_announcement) re-queries
 * the table by id. Postgres evaluates that subquery using the same command's snapshot,
 * so it cannot see a row this same INSERT statement just wrote. Requesting `.select()`
 * (RETURNING) immediately after insert therefore fails RLS even for authorized users
 * (same root cause as the calendar_events finding). We generate the id client-side and
 * avoid `.select()` after insert instead of relying on RETURNING.
 */

export type CreateAnnouncementParams = {
  title: string;
  body: string;
  targetType: 'all_staff' | 'roles' | 'groups';
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  roles?: string[];
  groups?: string[];
};

export type AdminActionResult = {
  success: boolean;
  error: string | null;
};

const VALID_ROLES = ['staff', 'mentor', 'master', 'counselor', 'leadership', 'manager', 'super_admin'];

export async function createAnnouncementAction(
  params: CreateAnnouncementParams
): Promise<AdminActionResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  // 2. Check permissions
  const { data: isLeadership, error: permissionError } = await supabase.rpc(
    'current_user_is_leadership_or_above'
  );

  if (permissionError || !isLeadership) {
    return { success: false, error: 'announcements.error.forbidden' };
  }

  // 3. Validate title and body
  const title = params.title.trim();
  const body = params.body.trim();

  if (!title) {
    return { success: false, error: 'admin.announcements.errorTitleRequired' };
  }
  if (!body) {
    return { success: false, error: 'admin.announcements.errorBodyRequired' };
  }

  // 4. Validate targets
  if (params.targetType === 'roles') {
    if (!params.roles || params.roles.length === 0) {
      return { success: false, error: 'admin.announcements.errorRolesRequired' };
    }
    const invalidRole = params.roles.find(r => !VALID_ROLES.includes(r));
    if (invalidRole) {
      return { success: false, error: 'admin.announcements.errorInvalidRole' };
    }
  }

  if (params.targetType === 'groups') {
    if (!params.groups || params.groups.length === 0) {
      return { success: false, error: 'admin.announcements.errorGroupsRequired' };
    }
  }

  // 5. Insert announcement
  const announcementId = randomUUID();

  const { error: insertError } = await supabase.from('announcements').insert({
    id: announcementId,
    title,
    body,
    author_id: user.id,
    target_type: params.targetType,
    is_pinned: params.isPinned,
    requires_acknowledgement: params.requiresAcknowledgement,
  });

  if (insertError) {
    console.error('Failed to create announcement row:', insertError);
    return { success: false, error: 'admin.announcements.errorCreateFailed' };
  }

  // 6. Insert target role mappings
  if (params.targetType === 'roles' && params.roles) {
    const rolesData = params.roles.map(r => ({
      announcement_id: announcementId,
      role: r as AppRole,
    }));

    const { error: rolesError } = await supabase
      .from('announcement_target_roles')
      .insert(rolesData);

    if (rolesError) {
      console.error('Failed to insert announcement target roles:', rolesError);
      // Clean up announcement row to maintain transaction integrity
      await supabase.from('announcements').delete().eq('id', announcementId);
      return { success: false, error: 'admin.announcements.errorCreateFailed' };
    }
  }

  // 7. Insert target group mappings
  if (params.targetType === 'groups' && params.groups) {
    const groupsData = params.groups.map(g => ({
      announcement_id: announcementId,
      group_id: g,
    }));

    const { error: groupsError } = await supabase
      .from('announcement_target_groups')
      .insert(groupsData);

    if (groupsError) {
      console.error('Failed to insert announcement target groups:', groupsError);
      // Clean up announcement row to maintain transaction integrity
      await supabase.from('announcements').delete().eq('id', announcementId);
      return { success: false, error: 'admin.announcements.errorCreateFailed' };
    }
  }

  // 8. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'announcement.created',
      entityType: 'announcement',
      entityId: announcementId,
      afterData: {
        title,
        target_type: params.targetType,
        is_pinned: params.isPinned,
        requires_acknowledgement: params.requiresAcknowledgement,
        roles: params.roles,
        groups: params.groups,
      },
    });
  } catch (auditError) {
    console.error('Failed to write announcement creation audit log:', auditError);
  }

  // 9. Revalidate cache paths
  revalidatePath('/admin/announcements');
  revalidatePath('/announcements');
  revalidatePath('/dashboard');

  return { success: true, error: null };
}

export async function deleteAnnouncementAction(
  announcementId: string
): Promise<AdminActionResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  // 2. Fetch announcement before deletion for audit log
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('id, title, target_type')
    .eq('id', announcementId)
    .maybeSingle();

  if (fetchError || !announcement) {
    return { success: false, error: 'announcements.error.notFound' };
  }

  // 3. Delete announcement (RLS will check if the user is manager/super-admin)
  const { error: deleteError } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId);

  if (deleteError) {
    console.error('Failed to delete announcement:', deleteError);
    return { success: false, error: 'admin.announcements.errorDeleteFailed' };
  }

  // 4. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'announcement.deleted',
      entityType: 'announcement',
      entityId: announcementId,
      beforeData: {
        title: announcement.title,
        target_type: announcement.target_type,
      },
    });
  } catch (auditError) {
    console.error('Failed to write announcement deletion audit log:', auditError);
  }

  // 5. Revalidate cache paths
  revalidatePath('/admin/announcements');
  revalidatePath('/announcements');
  revalidatePath('/dashboard');

  return { success: true, error: null };
}
