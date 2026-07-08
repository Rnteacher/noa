'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import type { GoalStatus, TrafficLightStatus } from '@/features/students/types';
import { revalidatePath } from 'next/cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TAGS = ['general', 'project', 'emotional', 'attendance', 'family', 'incident'] as const;
const ALLOWED_PROJECT_STATUSES = ['green', 'yellow', 'red'] as const;
const ALLOWED_EMOTIONAL_STATUSES = ['green', 'yellow', 'red'] as const;
const ALLOWED_GOAL_STATUSES = ['active', 'completed', 'paused', 'archived'] as const;
const GOAL_TITLE_MAX_LENGTH = 120;
const GOAL_DESCRIPTION_MAX_LENGTH = 1000;

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

  // 6. Revalidate student card path
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

  revalidatePath(`/students/${studentId}`);

  return { success: true, error: null };
}

export type UpdateStudentGoalStatusFn = typeof updateStudentGoalStatus;
