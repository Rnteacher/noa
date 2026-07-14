import type { Database } from '@/types/supabase';

export type CalendarFeedEvent =
  Database['public']['Tables']['calendar_events']['Row'];

export type CalendarFeedData = {
  todayEvents: CalendarFeedEvent[];
  weekEvents: CalendarFeedEvent[];
  error: string | null;
};
