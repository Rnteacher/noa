import 'server-only';
import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }

  return count ?? 0;
}

export async function getNotifications(
  suppliedClient?: SupabaseServerClient
): Promise<{
  notifications: NotificationItem[];
  error: string | null;
}> {
  const supabase = suppliedClient ?? (await createClient());
  const { data: claimsData, error: userError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userError || !userId) {
    return { notifications: [], error: 'dashboard.error.noSession' };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch notifications:', error);
    return { notifications: [], error: 'notifications.error.failedToLoad' };
  }

  return { notifications: data ?? [], error: null };
}
