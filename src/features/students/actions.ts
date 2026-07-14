'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import type { GoalStatus, TrafficLightStatus } from '@/features/students/types';
import {
  sendStudentChangePush,
  type StudentChangePushInput,
} from '@/features/notifications/send-push';
import { revalidatePath } from 'next/cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TAGS = ['general', 'project', 'emotional', 'attendance', 'family', 'incident'] as const;
const ALLOWED_PROJECT_STATUSES = ['green', 'yellow', 'red'] as const;
const ALLOWED_EMOTIONAL_STATUSES = ['green', 'yellow', 'red'] as const;
const ALLOWED_GOAL_STATUSES = ['active', 'completed', 'paused', 'archived'] as const;
const GOAL_TITLE_MAX_LENGTH = 120;
const GOAL_DESCRIPTION_MAX_LENGTH = 1000;

async function notifyStudentChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  studentId: string,
  eventType: StudentChangePushInput['eventType'],
  context: string
) {
  const { error } = await supabase.rpc('create_student_change_notification', {
    actor_id: actorId,
    target_student_id: studentId,
    event_type: eventType,
  });

  if (error) {
    console.error(`Failed to create notifications for ${context}:`, error);
    return;
  }

  try {
    await sendStudentChangePush({
      actorId,
      studentId,
      eventType,
    });
  } catch (pushError) {
    console.error(`Failed to send push notifications for ${context}:`, pushError);
  }
}

export type CreateStudentMessageResult = {
  success: boolean;
  error: string | null;
};

export async function createStudentMessage(
  studentId: string,
  body: string,
  tag: typeof ALLOWED_TAGS[number] | null,
  isImportant: boolean
): Promise<CreateStudentMessageResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return { success: false, error: 'students.messages.emptyBody' };
  }

  if (trimmedBody.length > 2000) {
    return { success: false, error: 'students.messages.bodyTooLong' };
  }

  if (tag && !ALLOWED_TAGS.includes(tag)) {
    return { success: false, error: 'students.messages.invalidTag' };
  }

  // 3. Defensive check: is target student visible to the user?
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 4. Insert student message
  const tags = tag ? [tag] : ['general'];

  const { data: message, error: insertError } = await supabase
    .from('student_messages')
    .insert({
      student_id: studentId,
      author_id: user.id,
      body: trimmedBody,
      tags,
      is_important: isImportant,
    })
    .select('id, body, tags, is_important, created_at')
    .single();

  if (insertError || !message) {
    return { success: false, error: 'students.messages.createFailed' };
  }

  // 5. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_message.created',
      entityType: 'student_message',
      entityId: message.id,
      afterData: message,
    });
  } catch (auditError) {
    // Log audit failure but do not crash response
    console.error('Failed to write audit log for student message:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_message.created',
    'message'
  );

  // 7. Revalidate student card path
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}
export type CreateStudentMessageFn = typeof createStudentMessage;

export type DeleteStudentMessageResult = {
  success: boolean;
  error: string | null;
};

export async function deleteStudentMessage(
  studentId: string,
  messageId: string
): Promise<DeleteStudentMessageResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(messageId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  // 3. Defensive check: is student visible?
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 4. Fetch the message details to verify ownership and state
  const { data: messageRow, error: messageError } = await supabase
    .from('student_messages')
    .select('id, student_id, author_id, body, tags, is_important, created_at, deleted_at')
    .eq('id', messageId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (messageError || !messageRow) {
    return { success: false, error: 'students.messages.notFound' };
  }

  if (messageRow.deleted_at) {
    return { success: false, error: 'students.messages.alreadyDeleted' };
  }

  // 5. Verify permissions
  const isAuthor = messageRow.author_id === user.id;
  const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');

  if (!isAuthor && !isSuperAdmin) {
    return { success: false, error: 'students.messages.deleteForbidden' };
  }

  // 6. Update (soft delete) message
  const { error: deleteError } = await supabase
    .from('student_messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq('id', messageId);

  if (deleteError) {
    return { success: false, error: 'students.messages.deleteFailed' };
  }

  // 7. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_message.deleted',
      entityType: 'student_message',
      entityId: messageId,
      beforeData: messageRow,
      afterData: {
        ...messageRow,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student message deletion:', auditError);
  }

  // 8. Revalidate student detail path
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type DeleteStudentMessageFn = typeof deleteStudentMessage;

export type UpdateStudentMessageResult = {
  success: boolean;
  error: string | null;
};

export async function updateStudentMessage(
  studentId: string,
  messageId: string,
  body: string,
  tag: typeof ALLOWED_TAGS[number] | null,
  isImportant: boolean
): Promise<UpdateStudentMessageResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(messageId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return { success: false, error: 'students.messages.emptyBody' };
  }

  if (trimmedBody.length > 2000) {
    return { success: false, error: 'students.messages.bodyTooLong' };
  }

  if (tag && !ALLOWED_TAGS.includes(tag)) {
    return { success: false, error: 'students.messages.invalidTag' };
  }

  // 3. Defensive check: is target student visible to the user?
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 4. Fetch the message to verify ownership and state
  const { data: messageRow, error: messageError } = await supabase
    .from('student_messages')
    .select('id, student_id, author_id, body, tags, is_important, created_at, deleted_at')
    .eq('id', messageId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (messageError || !messageRow) {
    return { success: false, error: 'students.messages.notFound' };
  }

  if (messageRow.deleted_at) {
    return { success: false, error: 'students.messages.alreadyDeleted' };
  }

  // 5. Verify permissions: author of the message, or super admin
  const isAuthor = messageRow.author_id === user.id;
  const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');

  if (!isAuthor && !isSuperAdmin) {
    return { success: false, error: 'students.messages.editForbidden' };
  }

  const tags = tag ? [tag] : ['general'];

  // 6. Update only body, tags, and is_important. author_id/student_id/deleted_at are untouched.
  const { error: updateError } = await supabase
    .from('student_messages')
    .update({
      body: trimmedBody,
      tags,
      is_important: isImportant,
    })
    .eq('id', messageId)
    .eq('student_id', studentId);

  if (updateError) {
    return { success: false, error: 'students.messages.editFailed' };
  }

  // 7. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_message.updated',
      entityType: 'student_message',
      entityId: messageId,
      beforeData: messageRow,
      afterData: {
        ...messageRow,
        body: trimmedBody,
        tags,
        is_important: isImportant,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student message update:', auditError);
  }

  // Notifications are intentionally not triggered here: the hardened
  // create_student_change_notification RPC's event-type allowlist has no entry for
  // message edits, and reusing "student_message.created" would misrepresent the event
  // and re-notify followers as if it were a brand-new message. Deferred until the RPC
  // supports a dedicated event type.

  // 8. Revalidate student card path
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateStudentMessageFn = typeof updateStudentMessage;

export type UpdateProjectStatusResult = {
  success: boolean;
  error: string | null;
};

export async function updateProjectStatus(
  studentId: string,
  projectId: string,
  newStatus: TrafficLightStatus
): Promise<UpdateProjectStatusResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(projectId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  if (!ALLOWED_PROJECT_STATUSES.includes(newStatus)) {
    return { success: false, error: 'students.projectStatus.invalidStatus' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, student_id, status, status_note, is_current, updated_by, updated_at')
    .eq('id', projectId)
    .eq('student_id', studentId)
    .eq('is_current', true)
    .maybeSingle();

  if (projectError || !project) {
    return { success: false, error: 'students.projectStatus.projectNotFound' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const [rowPermissionResult, managerOrSuperAdminResult, projectMasterAssignmentResult] =
    await Promise.all([
      supabase.rpc('current_user_can_update_student_project', {
        target_student_id: studentId,
      }),
      supabase.rpc('current_user_is_manager_or_super_admin'),
      supabase
        .from('student_masters')
        .select('id')
        .eq('student_id', studentId)
        .eq('project_id', projectId)
        .eq('master_id', user.id)
        .lte('active_from', today)
        .or(`active_until.is.null,active_until.gte.${today}`)
        .maybeSingle(),
    ]);

  const hasAllowedRoleOrRelationship = Boolean(
    (managerOrSuperAdminResult.data && !managerOrSuperAdminResult.error) ||
      (projectMasterAssignmentResult.data && !projectMasterAssignmentResult.error)
  );

  if (
    rowPermissionResult.error ||
    !rowPermissionResult.data ||
    !hasAllowedRoleOrRelationship
  ) {
    return { success: false, error: 'students.projectStatus.updateForbidden' };
  }

  if (project.status === newStatus) {
    return { success: true, error: null };
  }

  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update({
      status: newStatus,
      updated_by: user.id,
    })
    .eq('id', projectId)
    .eq('student_id', studentId)
    .eq('is_current', true)
    .select('id, student_id, status, status_note, is_current, updated_by, updated_at')
    .single();

  if (updateError || !updatedProject) {
    return { success: false, error: 'students.projectStatus.updateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'project.status_updated',
      entityType: 'project',
      entityId: projectId,
      beforeData: project,
      afterData: updatedProject,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for project status update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'project.status_updated',
    'project update'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateProjectStatusFn = typeof updateProjectStatus;

export type UpdateEmotionalStatusResult = {
  success: boolean;
  error: string | null;
};

export async function updateEmotionalStatus(
  studentId: string,
  newStatus: TrafficLightStatus
): Promise<UpdateEmotionalStatusResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  if (!ALLOWED_EMOTIONAL_STATUSES.includes(newStatus)) {
    return { success: false, error: 'students.emotionalStatus.invalidStatus' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, group_id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const [
    rowPermissionResult,
    managerOrSuperAdminResult,
    counselorRoleResult,
    mentorAssignmentResult,
  ] = await Promise.all([
    supabase.rpc('current_user_can_update_student_emotional_status', {
      target_student_id: studentId,
    }),
    supabase.rpc('current_user_is_manager_or_super_admin'),
    supabase.rpc('current_user_has_role', { required_role: 'counselor' }),
    supabase
      .from('group_mentors')
      .select('id')
      .eq('group_id', student.group_id)
      .eq('mentor_id', user.id)
      .lte('active_from', today)
      .or(`active_until.is.null,active_until.gte.${today}`)
      .limit(1)
      .maybeSingle(),
  ]);

  const hasAllowedRoleOrRelationship = Boolean(
    (managerOrSuperAdminResult.data && !managerOrSuperAdminResult.error) ||
      (counselorRoleResult.data && !counselorRoleResult.error) ||
      (mentorAssignmentResult.data && !mentorAssignmentResult.error)
  );

  if (
    rowPermissionResult.error ||
    !rowPermissionResult.data ||
    !hasAllowedRoleOrRelationship
  ) {
    return { success: false, error: 'students.emotionalStatus.updateForbidden' };
  }

  // Read only status metadata for the audit trail; the sensitive note field stays untouched.
  const { data: latestStatus } = await supabase
    .from('latest_student_emotional_statuses')
    .select('emotional_status_id, status, created_at')
    .eq('student_id', studentId)
    .maybeSingle();

  if (latestStatus?.status === newStatus) {
    return { success: true, error: null };
  }

  const { data: insertedStatus, error: insertError } = await supabase
    .from('student_emotional_statuses')
    .insert({
      student_id: studentId,
      status: newStatus,
      created_by: user.id,
    })
    .select('id, student_id, status, created_by, created_at')
    .single();

  if (insertError || !insertedStatus) {
    return { success: false, error: 'students.emotionalStatus.updateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_emotional_status.updated',
      entityType: 'student_emotional_status',
      entityId: insertedStatus.id,
      beforeData: latestStatus
        ? {
            emotional_status_id: latestStatus.emotional_status_id,
            student_id: studentId,
            status: latestStatus.status,
            created_at: latestStatus.created_at,
          }
        : null,
      afterData: insertedStatus,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for emotional status update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_emotional_status.updated',
    'emotional update'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateEmotionalStatusFn = typeof updateEmotionalStatus;

type GoalManagementCheck = {
  allowed: boolean;
};

async function verifyGoalManagementPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studentId: string,
  studentGroupId: string
): Promise<GoalManagementCheck> {
  const today = new Date().toISOString().slice(0, 10);
  const [rowPermissionResult, managerOrSuperAdminResult, mentorAssignmentResult] =
    await Promise.all([
      supabase.rpc('current_user_can_update_student_goals', {
        target_student_id: studentId,
      }),
      supabase.rpc('current_user_is_manager_or_super_admin'),
      supabase
        .from('group_mentors')
        .select('id')
        .eq('group_id', studentGroupId)
        .eq('mentor_id', userId)
        .lte('active_from', today)
        .or(`active_until.is.null,active_until.gte.${today}`)
        .limit(1)
        .maybeSingle(),
    ]);

  const hasAllowedRoleOrRelationship = Boolean(
    (managerOrSuperAdminResult.data && !managerOrSuperAdminResult.error) ||
      (mentorAssignmentResult.data && !mentorAssignmentResult.error)
  );

  return {
    allowed: Boolean(
      rowPermissionResult.data &&
        !rowPermissionResult.error &&
        hasAllowedRoleOrRelationship
    ),
  };
}

export type CreateStudentGoalResult = {
  success: boolean;
  error: string | null;
};

export async function createStudentGoal(
  studentId: string,
  title: string,
  description: string
): Promise<CreateStudentGoalResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: 'students.goals.titleRequired' };
  }

  if (trimmedTitle.length > GOAL_TITLE_MAX_LENGTH) {
    return { success: false, error: 'students.goals.titleTooLong' };
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length > GOAL_DESCRIPTION_MAX_LENGTH) {
    return { success: false, error: 'students.goals.descriptionTooLong' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, group_id, school_year_id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const { allowed } = await verifyGoalManagementPermission(
    supabase,
    user.id,
    studentId,
    student.group_id
  );

  if (!allowed) {
    return { success: false, error: 'students.goals.manageForbidden' };
  }

  const { data: insertedGoal, error: insertError } = await supabase
    .from('student_goals')
    .insert({
      student_id: studentId,
      school_year_id: student.school_year_id,
      title: trimmedTitle,
      description: trimmedDescription || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id, student_id, school_year_id, title, description, status, is_primary, created_by, updated_by, created_at, updated_at')
    .single();

  if (insertError || !insertedGoal) {
    return { success: false, error: 'students.goals.createFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_goal.created',
      entityType: 'student_goal',
      entityId: insertedGoal.id,
      afterData: insertedGoal,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student goal creation:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_goal.created',
    'goal creation'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type CreateStudentGoalFn = typeof createStudentGoal;

export type UpdateStudentGoalStatusResult = {
  success: boolean;
  error: string | null;
};

export async function updateStudentGoalStatus(
  studentId: string,
  goalId: string,
  newStatus: GoalStatus
): Promise<UpdateStudentGoalStatusResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(goalId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  if (!ALLOWED_GOAL_STATUSES.includes(newStatus)) {
    return { success: false, error: 'students.goals.invalidStatus' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, group_id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const { data: goal, error: goalError } = await supabase
    .from('student_goals')
    .select('id, student_id, title, status, is_primary, updated_by, updated_at')
    .eq('id', goalId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (goalError || !goal) {
    return { success: false, error: 'students.goals.notFound' };
  }

  const { allowed } = await verifyGoalManagementPermission(
    supabase,
    user.id,
    studentId,
    student.group_id
  );

  if (!allowed) {
    return { success: false, error: 'students.goals.manageForbidden' };
  }

  if (goal.status === newStatus) {
    return { success: true, error: null };
  }

  const { data: updatedGoal, error: updateError } = await supabase
    .from('student_goals')
    .update({
      status: newStatus,
      updated_by: user.id,
    })
    .eq('id', goalId)
    .eq('student_id', studentId)
    .select('id, student_id, title, status, is_primary, updated_by, updated_at')
    .single();

  if (updateError || !updatedGoal) {
    return { success: false, error: 'students.goals.updateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_goal.updated',
      entityType: 'student_goal',
      entityId: goalId,
      beforeData: goal,
      afterData: updatedGoal,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student goal status update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_goal.updated',
    'goal status update'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateStudentGoalStatusFn = typeof updateStudentGoalStatus;

export type SetPrimaryStudentGoalResult = {
  success: boolean;
  error: string | null;
};

export async function setPrimaryStudentGoal(
  studentId: string,
  goalId: string
): Promise<SetPrimaryStudentGoalResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(goalId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  const { data: goal, error: goalError } = await supabase
    .from('student_goals')
    .select('id, student_id, school_year_id, title, status, is_primary, updated_by')
    .eq('id', goalId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (goalError || !goal) {
    return { success: false, error: 'students.goals.notFound' };
  }

  if (goal.is_primary) {
    return { success: true, error: null };
  }

  if (goal.status === 'archived') {
    return { success: false, error: 'students.goals.setPrimaryArchived' };
  }

  const { error: rpcError } = await supabase.rpc('set_primary_student_goal', {
    target_student_id: studentId,
    target_goal_id: goalId,
  });

  if (rpcError) {
    console.error('Failed to set primary student goal:', rpcError);

    if (rpcError.message?.includes('Unauthorized')) {
      return { success: false, error: 'students.goals.manageForbidden' };
    }

    if (rpcError.message?.includes('NotFound') || rpcError.message?.includes('Invalid')) {
      return { success: false, error: 'students.goals.notFound' };
    }

    return { success: false, error: 'students.goals.setPrimaryFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_goal.primary_updated',
      entityType: 'student_goal',
      entityId: goalId,
      beforeData: goal,
      afterData: { ...goal, is_primary: true, updated_by: user.id },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for primary goal update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_goal.updated',
    'primary goal update'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type SetPrimaryStudentGoalFn = typeof setPrimaryStudentGoal;

export type UpdateStudentGoalDetailsResult = {
  success: boolean;
  error: string | null;
};

export async function updateStudentGoalDetails(
  studentId: string,
  goalId: string,
  title: string,
  description: string
): Promise<UpdateStudentGoalDetailsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(goalId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: 'students.goals.titleRequired' };
  }

  if (trimmedTitle.length > GOAL_TITLE_MAX_LENGTH) {
    return { success: false, error: 'students.goals.titleTooLong' };
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length > GOAL_DESCRIPTION_MAX_LENGTH) {
    return { success: false, error: 'students.goals.descriptionTooLong' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, group_id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const { data: goal, error: goalError } = await supabase
    .from('student_goals')
    .select('id, student_id, title, description, status, is_primary, visible_to_student, updated_by, updated_at')
    .eq('id', goalId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (goalError || !goal) {
    return { success: false, error: 'students.goals.notFound' };
  }

  const { allowed } = await verifyGoalManagementPermission(
    supabase,
    user.id,
    studentId,
    student.group_id
  );

  if (!allowed) {
    return { success: false, error: 'students.goals.manageForbidden' };
  }

  const normalizedDescription = trimmedDescription || null;

  if (goal.title === trimmedTitle && goal.description === normalizedDescription) {
    return { success: true, error: null };
  }

  const { data: updatedGoal, error: updateError } = await supabase
    .from('student_goals')
    .update({
      title: trimmedTitle,
      description: normalizedDescription,
      updated_by: user.id,
    })
    .eq('id', goalId)
    .eq('student_id', studentId)
    .select('id, student_id, title, description, status, is_primary, visible_to_student, updated_by, updated_at')
    .single();

  if (updateError || !updatedGoal) {
    return { success: false, error: 'students.goals.detailsUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_goal.details_updated',
      entityType: 'student_goal',
      entityId: goalId,
      beforeData: goal,
      afterData: updatedGoal,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student goal details update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_goal.updated',
    'goal update'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateStudentGoalDetailsFn = typeof updateStudentGoalDetails;

export type DeleteStudentGoalResult = {
  success: boolean;
  error: string | null;
};

export async function deleteStudentGoal(
  studentId: string,
  goalId: string
): Promise<DeleteStudentGoalResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  if (!UUID_PATTERN.test(studentId) || !UUID_PATTERN.test(goalId)) {
    return { success: false, error: 'students.card.invalidIdFormat' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  const { data: isManagerOrSuperAdmin, error: managerError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (managerError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'students.goals.deleteForbidden' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  const { data: goal, error: goalError } = await supabase
    .from('student_goals')
    .select('id, student_id, school_year_id, title, description, status, is_primary, visible_to_student, created_by, updated_by, created_at, updated_at')
    .eq('id', goalId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (goalError || !goal) {
    return { success: false, error: 'students.goals.notFound' };
  }

  const { error: deleteError } = await supabase
    .from('student_goals')
    .delete()
    .eq('id', goalId)
    .eq('student_id', studentId);

  if (deleteError) {
    return { success: false, error: 'students.goals.deleteFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_goal.deleted',
      entityType: 'student_goal',
      entityId: goalId,
      beforeData: goal,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student goal deletion:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_goal.deleted',
    'goal deletion'
  );

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type DeleteStudentGoalFn = typeof deleteStudentGoal;

export type FollowStudentResult = {
  success: boolean;
  error: string | null;
};

export async function followStudent(
  studentId: string
): Promise<FollowStudentResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  // 3. Check active staff
  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  // 4. Defensive check: is target student visible?
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 5. Idempotency check: check if already followed
  const { data: existing, error: existingError } = await supabase
    .from('followed_students')
    .select('id, profile_id, student_id, notification_level, created_at')
    .eq('profile_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: 'students.follow.errorFollow' };
  }

  if (existing) {
    return { success: true, error: null };
  }

  // 6. Insert followed student row
  const { data: inserted, error: insertError } = await supabase
    .from('followed_students')
    .insert({
      profile_id: user.id,
      student_id: studentId,
      notification_level: 'all',
    })
    .select('id, profile_id, student_id, notification_level, created_at')
    .single();

  if (insertError || !inserted) {
    return { success: false, error: 'students.follow.errorFollow' };
  }

  // 7. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_follow.created',
      entityType: 'followed_students',
      entityId: inserted.id,
      afterData: inserted,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student follow creation:', auditError);
  }

  // 8. Revalidate paths
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type FollowStudentFn = typeof followStudent;

export async function unfollowStudent(
  studentId: string
): Promise<FollowStudentResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  // 3. Check active staff
  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  // 4. Defensive check: is target student visible?
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 5. Idempotency check: check if followed
  const { data: existing, error: existingError } = await supabase
    .from('followed_students')
    .select('id, profile_id, student_id, notification_level, created_at')
    .eq('profile_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: 'students.follow.errorUnfollow' };
  }

  if (!existing) {
    return { success: true, error: null };
  }

  // 6. Delete followed student row
  const { error: deleteError } = await supabase
    .from('followed_students')
    .delete()
    .eq('profile_id', user.id)
    .eq('student_id', studentId);

  if (deleteError) {
    return { success: false, error: 'students.follow.errorUnfollow' };
  }

  // 7. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_follow.deleted',
      entityType: 'followed_students',
      entityId: existing.id,
      beforeData: existing,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student follow deletion:', auditError);
  }

  // 8. Revalidate paths
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UnfollowStudentFn = typeof unfollowStudent;

export type UpdateStudentPhotoResult = {
  success: boolean;
  error: string | null;
};

export async function updateStudentPhoto(
  studentId: string,
  formData: FormData
): Promise<UpdateStudentPhotoResult> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'students.error.noSession' };
  }

  // 2. Validate input
  if (!UUID_PATTERN.test(studentId)) {
    return { success: false, error: 'students.card.invalidStudentId' };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'students.photo.errorNoFile' };
  }

  const ALLOWED_TYPES = ['image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'students.photo.errorType' };
  }

  if (file.size > 1048576) { // 1MB limit for optimized WebP
    return { success: false, error: 'students.photo.errorSize' };
  }

  // 3. Check active staff
  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'students.error.noProfile' };
  }

  // 4. Verify student exists
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, group_id')
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: 'students.card.notFoundDescription' };
  }

  // 5. Verify permissions
  const today = new Date().toISOString().slice(0, 10);
  const [permissionResult, managerOrSuperAdminResult, mentorAssignmentResult] = await Promise.all([
    supabase.rpc('current_user_can_manage_student_photo', { target_student_id: studentId }),
    supabase.rpc('current_user_is_manager_or_super_admin'),
    supabase
      .from('group_mentors')
      .select('id')
      .eq('group_id', student.group_id)
      .eq('mentor_id', user.id)
      .lte('active_from', today)
      .or(`active_until.is.null,active_until.gte.${today}`)
      .limit(1)
      .maybeSingle()
  ]);

  const isManagerOrSuperAdmin = Boolean(managerOrSuperAdminResult.data && !managerOrSuperAdminResult.error);
  const isActiveGroupMentor = Boolean(mentorAssignmentResult.data && !mentorAssignmentResult.error);
  const hasPermission = Boolean(
    permissionResult.data &&
    !permissionResult.error &&
    (isManagerOrSuperAdmin || isActiveGroupMentor)
  );

  if (!hasPermission) {
    return { success: false, error: 'students.photo.errorForbidden' };
  }

  // 6. Upload file to storage
  const filePath = `students/${studentId}/profile.webp`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: 'students.photo.errorUpload' };
    }
  } catch (err) {
    console.error('Storage processing error:', err);
    return { success: false, error: 'students.photo.errorUpload' };
  }

  // 7. Get old photo url for audit log
  const { data: studentBefore } = await supabase
    .from('students')
    .select('photo_url')
    .eq('id', studentId)
    .single();

  // 8. Update student photo url via secure RPC
  const { error: updateError } = await supabase.rpc('update_student_photo_path', {
    target_student_id: studentId,
    new_photo_path: filePath,
  });

  if (updateError) {
    console.error('Database update RPC error:', updateError);
    return { success: false, error: 'students.photo.errorUpload' };
  }

  // Fetch updated row for the audit log
  const { data: studentAfter } = await supabase
    .from('students')
    .select('id, photo_url')
    .eq('id', studentId)
    .single();

  // 9. Write audit log
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'student_photo.updated',
      entityType: 'student',
      entityId: studentId,
      beforeData: studentBefore ? { photo_url: studentBefore.photo_url } : null,
      afterData: studentAfter ? { photo_url: studentAfter.photo_url } : null,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for student photo update:', auditError);
  }

  await notifyStudentChange(
    supabase,
    user.id,
    studentId,
    'student_photo.updated',
    'photo update'
  );

  // 10. Revalidate path
  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateStudentPhotoFn = typeof updateStudentPhoto;
