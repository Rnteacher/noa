'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import { dateStringFromParts, todayDateParts } from '@/lib/date/il-date';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_MAX_LENGTH = 160;
const LAYER_MAX_LENGTH = 80;

export type GroupActionResult = {
  success: boolean;
  error: string | null;
};

export type GroupInput = {
  name: string;
  layer: string;
  schoolYearId: string;
};

type ValidatedGroupInput = {
  name: string;
  layer: string | null;
  schoolYearId: string;
};

type GroupsAdminAuth =
  | { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } }
  | { error: string };

function validateGroupInput(input: GroupInput): { data: ValidatedGroupInput } | { error: string } {
  const name = input.name.trim();
  if (!name) {
    return { error: 'admin.groups.errorNameRequired' };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return { error: 'admin.groups.errorNameTooLong' };
  }

  const layer = input.layer.trim();
  if (layer.length > LAYER_MAX_LENGTH) {
    return { error: 'admin.groups.errorLayerTooLong' };
  }

  const schoolYearId = input.schoolYearId.trim();
  if (!UUID_PATTERN.test(schoolYearId)) {
    return { error: 'admin.groups.errorInvalidSchoolYear' };
  }

  return { data: { name, layer: layer || null, schoolYearId } };
}

async function requireGroupsAdmin(): Promise<GroupsAdminAuth> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'dashboard.error.noSession' as const };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { error: 'admin.groups.errorForbidden' as const };
  }

  return { supabase, user };
}

async function validateSchoolYearExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolYearId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('school_years')
    .select('id')
    .eq('id', schoolYearId)
    .maybeSingle();

  if (error || !data) {
    return 'admin.groups.errorInvalidSchoolYear';
  }
  return null;
}

export async function createGroup(input: GroupInput): Promise<GroupActionResult> {
  const auth = await requireGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  const validated = validateGroupInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const schoolYearError = await validateSchoolYearExists(supabase, data.schoolYearId);
  if (schoolYearError) {
    return { success: false, error: schoolYearError };
  }

  const groupId = randomUUID();

  const { error: insertError } = await supabase.from('student_groups').insert({
    id: groupId,
    school_year_id: data.schoolYearId,
    name: data.name,
    layer: data.layer,
    is_active: true,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'admin.groups.errorDuplicateName' };
    }
    console.error('Failed to create student group:', insertError);
    return { success: false, error: 'admin.groups.errorCreateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: auth.user.id,
      action: 'student_group.created',
      entityType: 'student_group',
      entityId: groupId,
      afterData: { id: groupId, name: data.name, layer: data.layer, school_year_id: data.schoolYearId },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student group creation:', auditError);
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin/calendar');

  return { success: true, error: null };
}

export async function updateGroup(groupId: string, input: GroupInput): Promise<GroupActionResult> {
  const auth = await requireGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  if (!UUID_PATTERN.test(groupId)) {
    return { success: false, error: 'admin.groups.errorInvalidId' };
  }

  const validated = validateGroupInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const schoolYearError = await validateSchoolYearExists(supabase, data.schoolYearId);
  if (schoolYearError) {
    return { success: false, error: schoolYearError };
  }

  const { data: existingGroup, error: fetchError } = await supabase
    .from('student_groups')
    .select('id, name, layer, school_year_id, is_active')
    .eq('id', groupId)
    .maybeSingle();

  if (fetchError || !existingGroup) {
    return { success: false, error: 'admin.groups.errorNotFound' };
  }

  const { error: updateError } = await supabase
    .from('student_groups')
    .update({ name: data.name, layer: data.layer, school_year_id: data.schoolYearId })
    .eq('id', groupId);

  if (updateError) {
    if (updateError.code === '23505') {
      return { success: false, error: 'admin.groups.errorDuplicateName' };
    }
    console.error('Failed to update student group:', updateError);
    return { success: false, error: 'admin.groups.errorUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: auth.user.id,
      action: 'student_group.updated',
      entityType: 'student_group',
      entityId: groupId,
      beforeData: existingGroup,
      afterData: { id: groupId, name: data.name, layer: data.layer, school_year_id: data.schoolYearId },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student group update:', auditError);
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin/calendar');

  return { success: true, error: null };
}

export async function setGroupActiveState(groupId: string, isActive: boolean): Promise<GroupActionResult> {
  const auth = await requireGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  if (!UUID_PATTERN.test(groupId)) {
    return { success: false, error: 'admin.groups.errorInvalidId' };
  }

  const { data: existingGroup, error: fetchError } = await supabase
    .from('student_groups')
    .select('id, name, is_active')
    .eq('id', groupId)
    .maybeSingle();

  if (fetchError || !existingGroup) {
    return { success: false, error: 'admin.groups.errorNotFound' };
  }

  const { error: updateError } = await supabase
    .from('student_groups')
    .update({ is_active: isActive })
    .eq('id', groupId);

  if (updateError) {
    console.error('Failed to change student group active state:', updateError);
    return { success: false, error: 'admin.groups.errorUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: auth.user.id,
      action: isActive ? 'student_group.activated' : 'student_group.archived',
      entityType: 'student_group',
      entityId: groupId,
      beforeData: { is_active: existingGroup.is_active },
      afterData: { is_active: isActive },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student group active state change:', auditError);
  }

  revalidatePath('/admin/groups');
  revalidatePath('/admin/calendar');

  return { success: true, error: null };
}

export async function assignMentor(groupId: string, mentorId: string): Promise<GroupActionResult> {
  const auth = await requireGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  if (!UUID_PATTERN.test(groupId) || !UUID_PATTERN.test(mentorId)) {
    return { success: false, error: 'admin.groups.errorInvalidId' };
  }

  const { data: group, error: groupError } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', groupId)
    .maybeSingle();

  if (groupError || !group) {
    return { success: false, error: 'admin.groups.errorNotFound' };
  }

  const { data: mentor, error: mentorError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', mentorId)
    .eq('is_active', true)
    .maybeSingle();

  if (mentorError || !mentor) {
    return { success: false, error: 'admin.groups.errorInvalidMentor' };
  }

  const { data: existingAssignment } = await supabase
    .from('group_mentors')
    .select('id')
    .eq('group_id', groupId)
    .eq('mentor_id', mentorId)
    .is('active_until', null)
    .maybeSingle();

  if (existingAssignment) {
    return { success: false, error: 'admin.groups.errorMentorAlreadyAssigned' };
  }

  const assignmentId = randomUUID();
  const today = dateStringFromParts(todayDateParts());

  const { error: insertError } = await supabase.from('group_mentors').insert({
    id: assignmentId,
    group_id: groupId,
    mentor_id: mentorId,
    is_primary: false,
    active_from: today,
    active_until: null,
  });

  if (insertError) {
    console.error('Failed to assign mentor:', insertError);
    return { success: false, error: 'admin.groups.errorAssignMentorFailed' };
  }

  try {
    await writeAuditLog({
      actorId: auth.user.id,
      action: 'group_mentor.assigned',
      entityType: 'student_group',
      entityId: groupId,
      afterData: { group_id: groupId, mentor_id: mentorId, active_from: today },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for mentor assignment:', auditError);
  }

  revalidatePath('/admin/groups');

  return { success: true, error: null };
}

export async function removeMentor(groupMentorId: string): Promise<GroupActionResult> {
  const auth = await requireGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  if (!UUID_PATTERN.test(groupMentorId)) {
    return { success: false, error: 'admin.groups.errorInvalidId' };
  }

  const { data: existingAssignment, error: fetchError } = await supabase
    .from('group_mentors')
    .select('id, group_id, mentor_id, active_until')
    .eq('id', groupMentorId)
    .maybeSingle();

  if (fetchError || !existingAssignment) {
    return { success: false, error: 'admin.groups.errorNotFound' };
  }

  if (existingAssignment.active_until !== null) {
    return { success: false, error: 'admin.groups.errorMentorAlreadyRemoved' };
  }

  const today = dateStringFromParts(todayDateParts());

  const { error: updateError } = await supabase
    .from('group_mentors')
    .update({ active_until: today })
    .eq('id', groupMentorId);

  if (updateError) {
    console.error('Failed to remove mentor assignment:', updateError);
    return { success: false, error: 'admin.groups.errorRemoveMentorFailed' };
  }

  try {
    await writeAuditLog({
      actorId: auth.user.id,
      action: 'group_mentor.removed',
      entityType: 'student_group',
      entityId: existingAssignment.group_id,
      beforeData: { group_mentor_id: groupMentorId, mentor_id: existingAssignment.mentor_id },
      afterData: { active_until: today },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for mentor removal:', auditError);
  }

  revalidatePath('/admin/groups');

  return { success: true, error: null };
}
