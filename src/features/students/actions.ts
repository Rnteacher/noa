'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import { revalidatePath } from 'next/cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TAGS = ['general', 'project', 'emotional', 'attendance', 'family', 'incident'] as const;

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
