'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function acknowledgeAnnouncement(
  announcementId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  // Defensive check: does the announcement exist and require acknowledgement?
  const { data: announcement, error: fetchError } = await supabase
    .from('announcements')
    .select('id, requires_acknowledgement')
    .eq('id', announcementId)
    .maybeSingle();

  if (fetchError || !announcement) {
    return { success: false, error: 'announcements.error.notFound' };
  }

  if (!announcement.requires_acknowledgement) {
    return { success: false, error: 'announcements.error.notRequired' };
  }

  // Idempotent insert/upsert in announcement_reads
  const { error } = await supabase
    .from('announcement_reads')
    .upsert(
      {
        announcement_id: announcementId,
        profile_id: user.id,
      },
      {
        onConflict: 'announcement_id,profile_id',
      }
    );

  if (error) {
    return { success: false, error: 'announcements.error.failedToAcknowledge' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/announcements');
  revalidatePath(`/announcements/${announcementId}`);

  return { success: true, error: null };
}
export type AcknowledgeAnnouncementFn = typeof acknowledgeAnnouncement;
