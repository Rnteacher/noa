'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/auth/admin';
import { normalizeEmail, type AppRole } from '@/lib/auth/access';
import { APP_ROLES } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';

const emailSchema = z.string().trim().toLowerCase().email();

type GrantSnapshot = {
  id: string;
  email: string;
  is_active: boolean;
  roles: AppRole[];
};

async function requireCurrentSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication is required.');
  }

  const { data: isSuperAdmin, error: roleError } = await supabase.rpc(
    'current_user_is_super_admin'
  );

  if (roleError || !isSuperAdmin) {
    throw new Error('Super admin permission is required.');
  }

  return user.id;
}

function parseRoles(formData: FormData) {
  const submittedRoles = formData.getAll('roles').map(String);
  const validRoleSet = new Set<AppRole>(APP_ROLES);
  const roles = submittedRoles.filter((role): role is AppRole =>
    validRoleSet.has(role as AppRole)
  );

  if (roles.length === 0) {
    throw new Error('At least one role is required.');
  }

  return Array.from(new Set(roles));
}

function parseIsActive(formData: FormData) {
  return formData.get('is_active') === 'on';
}

function rolesChanged(beforeRoles: AppRole[], afterRoles: AppRole[]) {
  const before = [...beforeRoles].sort().join(',');
  const after = [...afterRoles].sort().join(',');

  return before !== after;
}

async function getGrantSnapshot(grantId: string): Promise<GrantSnapshot | null> {
  const admin = createServiceRoleClient();
  const { data: grant, error: grantError } = await admin
    .from('staff_access_grants')
    .select('id, email, is_active')
    .eq('id', grantId)
    .maybeSingle();

  if (grantError) {
    throw grantError;
  }

  if (!grant) {
    return null;
  }

  const { data: roleRows, error: rolesError } = await admin
    .from('staff_access_grant_roles')
    .select('role')
    .eq('grant_id', grant.id);

  if (rolesError) {
    throw rolesError;
  }

  return {
    id: grant.id,
    email: grant.email,
    is_active: grant.is_active,
    roles: (roleRows || []).map((row) => row.role),
  };
}

async function replaceGrantRoles(grantId: string, roles: AppRole[]) {
  const admin = createServiceRoleClient();
  const { error: deleteError } = await admin
    .from('staff_access_grant_roles')
    .delete()
    .eq('grant_id', grantId);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await admin
    .from('staff_access_grant_roles')
    .insert(roles.map((role) => ({ grant_id: grantId, role })));

  if (insertError) {
    throw insertError;
  }
}

export async function createAccessGrantAction(formData: FormData) {
  const actorId = await requireCurrentSuperAdmin();
  const email = normalizeEmail(emailSchema.parse(String(formData.get('email') || '')));
  const roles = parseRoles(formData);
  const isActive = parseIsActive(formData);
  const admin = createServiceRoleClient();

  const { data: existingGrant, error: existingError } = await admin
    .from('staff_access_grants')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let grantId: string;
  let beforeData: GrantSnapshot | null = null;

  if (existingGrant) {
    beforeData = await getGrantSnapshot(existingGrant.id);

    const { data: updatedGrant, error: updateError } = await admin
      .from('staff_access_grants')
      .update({ is_active: isActive })
      .eq('id', existingGrant.id)
      .select('id')
      .single();

    if (updateError) {
      throw updateError;
    }

    grantId = updatedGrant.id;
  } else {
    const { data: insertedGrant, error: insertError } = await admin
      .from('staff_access_grants')
      .insert({
        email,
        is_active: isActive,
        created_by: actorId,
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    grantId = insertedGrant.id;
  }

  await replaceGrantRoles(grantId, roles);

  const afterData = await getGrantSnapshot(grantId);
  await writeAuditLog({
    actorId,
    action: existingGrant ? 'staff_access_grant.updated' : 'staff_access_grant.created',
    entityType: 'staff_access_grant',
    entityId: grantId,
    beforeData,
    afterData,
  });

  if (beforeData && rolesChanged(beforeData.roles, roles)) {
    await writeAuditLog({
      actorId,
      action: 'staff_access_grant.roles_updated',
      entityType: 'staff_access_grant',
      entityId: grantId,
      beforeData: { roles: beforeData.roles },
      afterData: { roles },
    });
  }

  if (beforeData && beforeData.is_active !== isActive) {
    await writeAuditLog({
      actorId,
      action: isActive
        ? 'staff_access_grant.activated'
        : 'staff_access_grant.deactivated',
      entityType: 'staff_access_grant',
      entityId: grantId,
      beforeData: { is_active: beforeData.is_active },
      afterData: { is_active: isActive },
    });
  }

  revalidatePath('/admin/access-grants');
}

export async function updateAccessGrantAction(formData: FormData) {
  const actorId = await requireCurrentSuperAdmin();
  const grantId = String(formData.get('grant_id') || '');
  const roles = parseRoles(formData);
  const isActive = parseIsActive(formData);
  const admin = createServiceRoleClient();
  const beforeData = await getGrantSnapshot(grantId);

  if (!beforeData) {
    throw new Error('Grant was not found.');
  }

  const { error: updateError } = await admin
    .from('staff_access_grants')
    .update({ is_active: isActive })
    .eq('id', grantId);

  if (updateError) {
    throw updateError;
  }

  await replaceGrantRoles(grantId, roles);

  const afterData = await getGrantSnapshot(grantId);
  await writeAuditLog({
    actorId,
    action: 'staff_access_grant.updated',
    entityType: 'staff_access_grant',
    entityId: grantId,
    beforeData,
    afterData,
  });

  if (rolesChanged(beforeData.roles, roles)) {
    await writeAuditLog({
      actorId,
      action: 'staff_access_grant.roles_updated',
      entityType: 'staff_access_grant',
      entityId: grantId,
      beforeData: { roles: beforeData.roles },
      afterData: { roles },
    });
  }

  if (beforeData.is_active !== isActive) {
    await writeAuditLog({
      actorId,
      action: isActive
        ? 'staff_access_grant.activated'
        : 'staff_access_grant.deactivated',
      entityType: 'staff_access_grant',
      entityId: grantId,
      beforeData: { is_active: beforeData.is_active },
      afterData: { is_active: isActive },
    });
  }

  revalidatePath('/admin/access-grants');
}
