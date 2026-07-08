import type { Database } from '@/types/supabase';

export type Announcement = Database['public']['Tables']['announcements']['Row'] & {
  author_name: string | null;
  acknowledged?: boolean;
};

export type SingleAnnouncementData = {
  announcement: Announcement | null;
  acknowledged: boolean;
  error?: string | null;
};
