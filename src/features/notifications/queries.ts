import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type NotificationItem = {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string | null;
  deep_link: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .is('read_at', null);

  if (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }

  return count ?? 0;
}

export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { notifications: [], error: 'dashboard.error.noSession' };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch notifications:', error);
    return { notifications: [], error: 'notifications.error.failedToLoad' };
  }

  return { notifications: data ?? [], error: null };
}
