import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/types/supabase';

export type CalendarEventVisibility = Enums<'event_visibility'>;

export const CALENDAR_EVENT_VISIBILITIES: CalendarEventVisibility[] = [
  'all_school',
  'groups',
  'staff_only',
  'leadership_only',
];

export type CalendarRangeFilter = 'upcoming' | 'today' | 'week' | 'month';

export type AdminCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: CalendarEventVisibility;
  location: string | null;
  targetGroupIds: string[];
  targetGroupNames: string[];
  updatedAt: string;
};

export type AdminCalendarGroupOption = {
  id: string;
  name: string;
};

export type AdminCalendarData = {
  events: AdminCalendarEvent[];
  groups: AdminCalendarGroupOption[];
  range: CalendarRangeFilter;
  isAuthorized: boolean;
  error: string | null;
};

type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  visibility: CalendarEventVisibility;
  location: string | null;
  updated_at: string;
  calendar_event_groups: { group_id: string; student_groups: { name: string } | { name: string }[] | null }[] | null;
};

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyAdminCalendarData(
  range: CalendarRangeFilter,
  isAuthorized: boolean,
  error: string | null
): AdminCalendarData {
  return { events: [], groups: [], range, isAuthorized, error };
}

const CALENDAR_EVENT_SELECT = `
  id,
  title,
  description,
  starts_at,
  ends_at,
  is_all_day,
  visibility,
  location,
  updated_at,
  calendar_event_groups(group_id, student_groups:group_id(name))
`;

export async function getAdminCalendarData(
  rawRange: string | undefined,
  now = new Date()
): Promise<AdminCalendarData> {
  const range: CalendarRangeFilter =
    rawRange === 'today' || rawRange === 'week' || rawRange === 'month'
      ? rawRange
      : 'upcoming';

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return emptyAdminCalendarData(range, false, 'dashboard.error.noSession');
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return emptyAdminCalendarData(range, false, 'admin.calendar.errorForbidden');
  }

  let query = supabase
    .from('calendar_events')
    .select(CALENDAR_EVENT_SELECT)
    .order('starts_at', { ascending: true });

  if (range === 'today') {
    const dayStart = startOfLocalDay(now);
    query = query
      .lt('starts_at', addDays(dayStart, 1).toISOString())
      .gt('ends_at', dayStart.toISOString());
  } else if (range === 'week') {
    query = query
      .gte('starts_at', now.toISOString())
      .lt('starts_at', addDays(now, 7).toISOString());
  } else if (range === 'month') {
    const monthStart = startOfMonth(now);
    query = query
      .lt('starts_at', addMonths(monthStart, 1).toISOString())
      .gt('ends_at', monthStart.toISOString());
  } else {
    query = query.gte('ends_at', now.toISOString()).limit(100);
  }

  const { data: eventsData, error: eventsError } = await query;

  if (eventsError) {
    console.error('Failed to load admin calendar events:', eventsError);
    return emptyAdminCalendarData(range, true, 'admin.calendar.errorLoadFailed');
  }

  const events: AdminCalendarEvent[] = ((eventsData ?? []) as CalendarEventRow[]).map((row) => {
    const targetGroups = (row.calendar_event_groups ?? []).flatMap((link) => {
      const group = relationOne(link.student_groups);
      return group ? [{ id: link.group_id, name: group.name }] : [];
    });

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isAllDay: row.is_all_day,
      visibility: row.visibility,
      location: row.location,
      targetGroupIds: targetGroups.map((group) => group.id),
      targetGroupNames: targetGroups.map((group) => group.name),
      updatedAt: row.updated_at,
    };
  });

  const { data: groupsData } = await supabase
    .from('student_groups')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return {
    events,
    groups: groupsData ?? [],
    range,
    isAuthorized: true,
    error: null,
  };
}
