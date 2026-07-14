'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { createClient } from '@/lib/supabase/server';
import {
  LEARNING_GROUP_WEEKDAYS,
  type LearningGroupWeekday,
} from '@/features/learning-groups/types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/;
const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 2000;
const ROOM_MAX_LENGTH = 160;
const WINDOW_START = '11:30:00';
const WINDOW_END = '13:30:00';

export type LearningGroupInput = {
  title: string;
  description: string;
  weekday: LearningGroupWeekday;
  startsAt: string;
  endsAt: string;
  leaderId: string;
  room: string;
  activeFrom: string;
  activeUntil: string;
  isActive: boolean;
  groupIds: string[];
};

export type LearningGroupActionResult = {
  success: boolean;
  error: string | null;
};

type ValidatedLearningGroupInput = {
  title: string;
  description: string | null;
  weekday: LearningGroupWeekday;
  startsAt: string;
  endsAt: string;
  leaderId: string | null;
  room: string | null;
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
  groupIds: string[];
};

type ExistingLearningGroup = {
  id: string;
  title: string;
  description: string | null;
  weekday: LearningGroupWeekday;
  starts_at: string;
  ends_at: string;
  leader_id: string | null;
  room: string | null;
  active_from: string;
  active_until: string | null;
  is_active: boolean;
  updated_at: string;
};

type LearningGroupsAdminAuth =
  | {
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: { id: string };
    }
  | { error: string };

function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  if (!TIME_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function isDateValue(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateLearningGroupInput(
  input: LearningGroupInput
): { data: ValidatedLearningGroupInput } | { error: string } {
  const title = input.title.trim();
  if (!title) {
    return { error: 'admin.learningGroups.errorTitleRequired' };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: 'admin.learningGroups.errorTitleTooLong' };
  }

  const description = input.description.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return { error: 'admin.learningGroups.errorDescriptionTooLong' };
  }

  const room = input.room.trim();
  if (room.length > ROOM_MAX_LENGTH) {
    return { error: 'admin.learningGroups.errorRoomTooLong' };
  }

  if (!LEARNING_GROUP_WEEKDAYS.includes(input.weekday)) {
    return { error: 'admin.learningGroups.errorInvalidWeekday' };
  }

  const startsAt = normalizeTime(input.startsAt);
  const endsAt = normalizeTime(input.endsAt);
  if (!startsAt || !endsAt) {
    return { error: 'admin.learningGroups.errorInvalidTime' };
  }

  if (endsAt <= startsAt) {
    return { error: 'admin.learningGroups.errorEndBeforeStart' };
  }

  if (startsAt < WINDOW_START || endsAt > WINDOW_END) {
    return { error: 'admin.learningGroups.errorTimeWindow' };
  }

  const activeFrom = input.activeFrom.trim();
  if (!isDateValue(activeFrom)) {
    return { error: 'admin.learningGroups.errorInvalidActiveFrom' };
  }

  const activeUntil = input.activeUntil.trim();
  if (activeUntil && !isDateValue(activeUntil)) {
    return { error: 'admin.learningGroups.errorInvalidActiveUntil' };
  }

  if (activeUntil && activeUntil < activeFrom) {
    return { error: 'admin.learningGroups.errorActiveUntilBeforeFrom' };
  }

  const leaderId = input.leaderId.trim();
  if (leaderId && !UUID_PATTERN.test(leaderId)) {
    return { error: 'admin.learningGroups.errorInvalidLeader' };
  }

  const groupIds = Array.from(new Set(input.groupIds));
  if (groupIds.length === 0) {
    return { error: 'admin.learningGroups.errorGroupsRequired' };
  }
  if (groupIds.some((groupId) => !UUID_PATTERN.test(groupId))) {
    return { error: 'admin.learningGroups.errorInvalidGroup' };
  }

  return {
    data: {
      title,
      description: description || null,
      weekday: input.weekday,
      startsAt,
      endsAt,
      leaderId: leaderId || null,
      room: room || null,
      activeFrom,
      activeUntil: activeUntil || null,
      isActive: input.isActive,
      groupIds,
    },
  };
}

async function requireLearningGroupsAdmin(): Promise<LearningGroupsAdminAuth> {
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
    return { error: 'admin.learningGroups.errorForbidden' as const };
  }

  return { supabase, user };
}

async function validateReferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ValidatedLearningGroupInput
): Promise<string | null> {
  const { data: groups, error: groupsError } = await supabase
    .from('student_groups')
    .select('id')
    .eq('is_active', true)
    .in('id', data.groupIds);

  if (groupsError || (groups ?? []).length !== data.groupIds.length) {
    return 'admin.learningGroups.errorInvalidGroup';
  }

  if (data.leaderId) {
    const { data: leader, error: leaderError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.leaderId)
      .eq('is_active', true)
      .maybeSingle();

    if (leaderError || !leader) {
      return 'admin.learningGroups.errorInvalidLeader';
    }
  }

  return null;
}

async function replaceTargetGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  learningGroupId: string,
  groupIds: string[]
): Promise<string | null> {
  const { error: clearGroupsError } = await supabase
    .from('learning_group_target_groups')
    .delete()
    .eq('learning_group_id', learningGroupId);

  if (clearGroupsError) {
    console.error('Failed to clear learning group target groups:', clearGroupsError);
    return 'admin.learningGroups.errorUpdateFailed';
  }

  const { error: groupsError } = await supabase.from('learning_group_target_groups').insert(
    groupIds.map((groupId) => ({
      learning_group_id: learningGroupId,
      group_id: groupId,
    }))
  );

  if (groupsError) {
    console.error('Failed to insert learning group target groups:', groupsError);
    return 'admin.learningGroups.errorUpdateFailed';
  }

  return null;
}

export async function createLearningGroup(
  input: LearningGroupInput
): Promise<LearningGroupActionResult> {
  const auth = await requireLearningGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase, user } = auth;

  const validated = validateLearningGroupInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const referencesError = await validateReferences(supabase, data);
  if (referencesError) {
    return { success: false, error: referencesError };
  }

  const { data: schoolYear, error: schoolYearError } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  if (schoolYearError || !schoolYear) {
    return { success: false, error: 'admin.learningGroups.errorNoCurrentSchoolYear' };
  }

  const learningGroupId = randomUUID();

  const { error: insertError } = await supabase.from('learning_groups').insert({
    id: learningGroupId,
    school_year_id: schoolYear.id,
    title: data.title,
    description: data.description,
    weekday: data.weekday,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    leader_id: data.leaderId,
    room: data.room,
    active_from: data.activeFrom,
    active_until: data.activeUntil,
    is_active: data.isActive,
    created_by: user.id,
    updated_by: user.id,
  });

  if (insertError) {
    console.error('Failed to create learning group:', insertError);
    return { success: false, error: 'admin.learningGroups.errorCreateFailed' };
  }

  const targetGroupsError = await replaceTargetGroups(supabase, learningGroupId, data.groupIds);
  if (targetGroupsError) {
    await supabase.from('learning_groups').delete().eq('id', learningGroupId);
    return { success: false, error: 'admin.learningGroups.errorCreateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'learning_group.created',
      entityType: 'learning_group',
      entityId: learningGroupId,
      afterData: {
        id: learningGroupId,
        title: data.title,
        weekday: data.weekday,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        leader_id: data.leaderId,
        room: data.room,
        active_from: data.activeFrom,
        active_until: data.activeUntil,
        is_active: data.isActive,
        group_ids: data.groupIds,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for learning group creation:', auditError);
  }

  revalidatePath('/admin/learning-groups');

  return { success: true, error: null };
}

export async function updateLearningGroup(
  learningGroupId: string,
  input: LearningGroupInput
): Promise<LearningGroupActionResult> {
  const auth = await requireLearningGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase, user } = auth;

  if (!UUID_PATTERN.test(learningGroupId)) {
    return { success: false, error: 'admin.learningGroups.errorInvalidId' };
  }

  const validated = validateLearningGroupInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const referencesError = await validateReferences(supabase, data);
  if (referencesError) {
    return { success: false, error: referencesError };
  }

  const { data: existingLearningGroup, error: fetchError } = await supabase
    .from('learning_groups')
    .select(
      'id, title, description, weekday, starts_at, ends_at, leader_id, room, active_from, active_until, is_active, updated_at'
    )
    .eq('id', learningGroupId)
    .maybeSingle();

  if (fetchError || !existingLearningGroup) {
    return { success: false, error: 'admin.learningGroups.errorNotFound' };
  }

  const { data: existingTargetGroups } = await supabase
    .from('learning_group_target_groups')
    .select('group_id')
    .eq('learning_group_id', learningGroupId);

  const { error: updateError } = await supabase
    .from('learning_groups')
    .update({
      title: data.title,
      description: data.description,
      weekday: data.weekday,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      leader_id: data.leaderId,
      room: data.room,
      active_from: data.activeFrom,
      active_until: data.activeUntil,
      is_active: data.isActive,
      updated_by: user.id,
    })
    .eq('id', learningGroupId);

  if (updateError) {
    console.error('Failed to update learning group:', updateError);
    return { success: false, error: 'admin.learningGroups.errorUpdateFailed' };
  }

  const targetGroupsError = await replaceTargetGroups(supabase, learningGroupId, data.groupIds);
  if (targetGroupsError) {
    return { success: false, error: targetGroupsError };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'learning_group.updated',
      entityType: 'learning_group',
      entityId: learningGroupId,
      beforeData: {
        ...(existingLearningGroup as ExistingLearningGroup),
        group_ids: existingTargetGroups?.map((group) => group.group_id) ?? [],
      },
      afterData: {
        id: learningGroupId,
        title: data.title,
        description: data.description,
        weekday: data.weekday,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        leader_id: data.leaderId,
        room: data.room,
        active_from: data.activeFrom,
        active_until: data.activeUntil,
        is_active: data.isActive,
        group_ids: data.groupIds,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for learning group update:', auditError);
  }

  revalidatePath('/admin/learning-groups');

  return { success: true, error: null };
}

export async function archiveLearningGroup(
  learningGroupId: string
): Promise<LearningGroupActionResult> {
  const auth = await requireLearningGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase, user } = auth;

  if (!UUID_PATTERN.test(learningGroupId)) {
    return { success: false, error: 'admin.learningGroups.errorInvalidId' };
  }

  const { data: existingLearningGroup, error: fetchError } = await supabase
    .from('learning_groups')
    .select(
      'id, title, description, weekday, starts_at, ends_at, leader_id, room, active_from, active_until, is_active, updated_at'
    )
    .eq('id', learningGroupId)
    .maybeSingle();

  if (fetchError || !existingLearningGroup) {
    return { success: false, error: 'admin.learningGroups.errorNotFound' };
  }

  const { data: existingTargetGroups } = await supabase
    .from('learning_group_target_groups')
    .select('group_id')
    .eq('learning_group_id', learningGroupId);

  const { error: archiveError } = await supabase
    .from('learning_groups')
    .update({
      is_active: false,
      updated_by: user.id,
    })
    .eq('id', learningGroupId);

  if (archiveError) {
    console.error('Failed to archive learning group:', archiveError);
    return { success: false, error: 'admin.learningGroups.errorArchiveFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'learning_group.archived',
      entityType: 'learning_group',
      entityId: learningGroupId,
      beforeData: {
        ...(existingLearningGroup as ExistingLearningGroup),
        group_ids: existingTargetGroups?.map((group) => group.group_id) ?? [],
      },
      afterData: {
        id: learningGroupId,
        is_active: false,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for learning group archive:', auditError);
  }

  revalidatePath('/admin/learning-groups');

  return { success: true, error: null };
}

export async function rescheduleLearningGroup(
  learningGroupId: string,
  targetWeekday: LearningGroupWeekday,
  targetStartsAt: string
): Promise<LearningGroupActionResult> {
  const auth = await requireLearningGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase, user } = auth;

  if (!UUID_PATTERN.test(learningGroupId)) {
    return { success: false, error: 'admin.learningGroups.errorInvalidId' };
  }

  if (!LEARNING_GROUP_WEEKDAYS.includes(targetWeekday)) {
    return { success: false, error: 'admin.learningGroups.errorInvalidWeekday' };
  }

  const startsAt = normalizeTime(targetStartsAt);
  if (!startsAt) {
    return { success: false, error: 'admin.learningGroups.errorInvalidTime' };
  }

  const { data: existingLearningGroup, error: fetchError } = await supabase
    .from('learning_groups')
    .select(
      'id, title, description, weekday, starts_at, ends_at, leader_id, room, active_from, active_until, is_active, updated_at'
    )
    .eq('id', learningGroupId)
    .maybeSingle();

  if (fetchError || !existingLearningGroup) {
    return { success: false, error: 'admin.learningGroups.errorNotFound' };
  }

  function timeStringToMinutes(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }

  function minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:00`;
  }

  const startMinutes = timeStringToMinutes(existingLearningGroup.starts_at);
  const endMinutes = timeStringToMinutes(existingLearningGroup.ends_at);
  const durationMinutes = endMinutes - startMinutes;

  const targetStartMinutes = timeStringToMinutes(startsAt);
  const targetEndMinutes = targetStartMinutes + durationMinutes;

  const endsAt = minutesToTimeString(targetEndMinutes);

  if (endsAt <= startsAt) {
    return { success: false, error: 'admin.learningGroups.errorEndBeforeStart' };
  }

  if (startsAt < WINDOW_START || endsAt > WINDOW_END) {
    return { success: false, error: 'admin.learningGroups.errorTimeWindow' };
  }

  const { error: updateError } = await supabase
    .from('learning_groups')
    .update({
      weekday: targetWeekday,
      starts_at: startsAt,
      ends_at: endsAt,
      updated_by: user.id,
    })
    .eq('id', learningGroupId);

  if (updateError) {
    console.error('Failed to reschedule learning group:', updateError);
    return { success: false, error: 'admin.learningGroups.errorUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'learning_group.rescheduled',
      entityType: 'learning_group',
      entityId: learningGroupId,
      beforeData: {
        id: learningGroupId,
        title: existingLearningGroup.title,
        weekday: existingLearningGroup.weekday,
        starts_at: existingLearningGroup.starts_at,
        ends_at: existingLearningGroup.ends_at,
      },
      afterData: {
        id: learningGroupId,
        title: existingLearningGroup.title,
        weekday: targetWeekday,
        starts_at: startsAt,
        ends_at: endsAt,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for learning group reschedule:', auditError);
  }

  revalidatePath('/admin/learning-groups');

  return { success: true, error: null };
}

export type ImportedLearningGroupItem = {
  title: string;
  description: string | null;
  weekday: LearningGroupWeekday;
  startsAt: string;
  endsAt: string;
  room: string | null;
  leaderId: string | null;
  groupIds: string[];
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
};

export async function importLearningGroups(
  groups: ImportedLearningGroupItem[]
): Promise<LearningGroupActionResult> {
  const auth = await requireLearningGroupsAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }
  const { supabase, user } = auth;

  const { data: schoolYear, error: schoolYearError } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  if (schoolYearError || !schoolYear) {
    return { success: false, error: 'admin.learningGroups.errorNoCurrentSchoolYear' };
  }

  // Pre-validate all items server-side
  const validatedGroups: ValidatedLearningGroupInput[] = [];
  const seenGroups = new Set<string>();

  for (const item of groups) {
    const input: LearningGroupInput = {
      title: item.title,
      description: item.description ?? '',
      weekday: item.weekday,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      leaderId: item.leaderId ?? '',
      room: item.room ?? '',
      activeFrom: item.activeFrom,
      activeUntil: item.activeUntil ?? '',
      isActive: item.isActive,
      groupIds: item.groupIds,
    };

    const validated = validateLearningGroupInput(input);
    if ('error' in validated) {
      return { success: false, error: validated.error };
    }

    const dupKey = `${validated.data.title}|${validated.data.weekday}|${validated.data.startsAt}|${validated.data.endsAt}`;
    if (seenGroups.has(dupKey)) {
      return { success: false, error: 'admin.learningGroups.errorDuplicateRow' };
    }
    seenGroups.add(dupKey);

    const refError = await validateReferences(supabase, validated.data);
    if (refError) {
      return { success: false, error: refError };
    }

    validatedGroups.push(validated.data);
  }

  // Batch insert
  for (const data of validatedGroups) {
    const learningGroupId = randomUUID();

    const { error: insertError } = await supabase.from('learning_groups').insert({
      id: learningGroupId,
      school_year_id: schoolYear.id,
      title: data.title,
      description: data.description,
      weekday: data.weekday,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      leader_id: data.leaderId,
      room: data.room,
      active_from: data.activeFrom,
      active_until: data.activeUntil,
      is_active: data.isActive,
      created_by: user.id,
      updated_by: user.id,
    });

    if (insertError) {
      console.error(`Import insertion failed for learning group: ${data.title}`, insertError);
      return { success: false, error: 'admin.learningGroups.errorCreateFailed' };
    }

    const targetGroupsError = await replaceTargetGroups(supabase, learningGroupId, data.groupIds);
    if (targetGroupsError) {
      console.error(`Import target group association failed for learning group: ${data.title}`, targetGroupsError);
      await supabase.from('learning_groups').delete().eq('id', learningGroupId);
      return { success: false, error: 'admin.learningGroups.errorCreateFailed' };
    }

    try {
      await writeAuditLog({
        actorId: user.id,
        action: 'learning_group.created',
        entityType: 'learning_group',
        entityId: learningGroupId,
        afterData: {
          id: learningGroupId,
          title: data.title,
          weekday: data.weekday,
          starts_at: data.startsAt,
          ends_at: data.endsAt,
          leader_id: data.leaderId,
          room: data.room,
          active_from: data.activeFrom,
          active_until: data.activeUntil,
          is_active: data.isActive,
          group_ids: data.groupIds,
          is_imported: true,
        },
      });
    } catch (auditError) {
      console.error('Failed to log imported learning group creation audit:', auditError);
    }
  }

  revalidatePath('/admin/learning-groups');
  revalidatePath('/admin/import-export');

  return { success: true, error: null };
}
