import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { CalendarFeedData, CalendarFeedEvent } from './types';

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const EVENT_SELECT =
  'id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id, updated_at';

/** Today's and this week's RLS-visible calendar events, for the Calendar tab. */
export async function getCalendarFeedData(now = new Date()): Promise<CalendarFeedData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { todayEvents: [], weekEvents: [], error: 'dashboard.error.noSession' };
  }

  const [todayEventsResult, weekEventsResult] = await Promise.all([
    supabase
      .from('calendar_events')
      .select(EVENT_SELECT)
      .lt('starts_at', addDays(startOfLocalDay(now), 1).toISOString())
      .gt('ends_at', startOfLocalDay(now).toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('calendar_events')
      .select(EVENT_SELECT)
      .gte('starts_at', now.toISOString())
      .lt('starts_at', addDays(now, 7).toISOString())
      .order('starts_at', { ascending: true })
      .limit(4),
  ]);

  return {
    todayEvents: todayEventsResult.error
      ? []
      : ((todayEventsResult.data ?? []) as CalendarFeedEvent[]),
    weekEvents: weekEventsResult.error
      ? []
      : ((weekEventsResult.data ?? []) as CalendarFeedEvent[]),
    error: null,
  };
}
