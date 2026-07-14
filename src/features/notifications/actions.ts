'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type NotificationActionResult = {
  success: boolean;
  error: string | null;
};

export async function markNotificationRead(
  notificationId: string
): Promise<NotificationActionResult> {
  const supabase = await createClient();

  const { data: claimsData, error: userError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userError || !userId) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('profile_id', userId);

  if (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: 'notifications.error.failedToUpdate' };
  }

  revalidatePath('/notifications');
  revalidatePath('/messages');
  revalidatePath('/settings');

  return { success: true, error: null };
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const supabase = await createClient();

  const { data: claimsData, error: userError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userError || !userId) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, error: 'notifications.error.failedToUpdate' };
  }

  revalidatePath('/notifications');
  revalidatePath('/messages');
  revalidatePath('/settings');

  return { success: true, error: null };
}

export async function getUnreadNotificationCountAction(): Promise<number> {
  const { getUnreadNotificationCount } = await import('@/features/notifications/queries');
  return getUnreadNotificationCount();
}
