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
