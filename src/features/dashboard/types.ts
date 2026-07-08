import type { Database } from '@/types/supabase';

export type DashboardAnnouncement =
  Database['public']['Tables']['announcements']['Row'] & {
    author_name: string | null;
  };

export type DashboardCalendarEvent =
  Database['public']['Tables']['calendar_events']['Row'];

export type DashboardData = {
  profile: {
    id: string;
    fullName: string;
  } | null;
  isSuperAdmin: boolean;
  requiredAcknowledgements: DashboardAnnouncement[];
  recentAnnouncements: DashboardAnnouncement[];
  todayEvents: DashboardCalendarEvent[];
  weekEvents: DashboardCalendarEvent[];
  followedStudentsCount: number;
  error: string | null;
};
