import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  DashboardAnnouncement,
  DashboardCalendarEvent,
  DashboardData,
} from '@/features/dashboard/types';

type AnnouncementRow = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  expires_at: string | null;
  is_pinned: boolean;
  published_at: string;
  push_enabled: boolean;
  requires_acknowledgement: boolean;
  target_type: DashboardAnnouncement['target_type'];
  title: string;
  updated_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

const ANNOUNCEMENT_SELECT = `
  id,
  author_id,
  body,
  created_at,
  expires_at,
  is_pinned,
  published_at,
  push_enabled,
  requires_acknowledgement,
  target_type,
  title,
  updated_at,
  profiles:author_id(full_name)
`;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeAnnouncement(row: AnnouncementRow): DashboardAnnouncement {
  const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    expires_at: row.expires_at,
    is_pinned: row.is_pinned,
    published_at: row.published_at,
    push_enabled: row.push_enabled,
    requires_acknowledgement: row.requires_acknowledgement,
    target_type: row.target_type,
    title: row.title,
    updated_at: row.updated_at,
    author_name: author?.full_name ?? null,
  };
}

function emptyDashboardData(error: string | null): DashboardData {
  return {
    profile: null,
    isSuperAdmin: false,
    requiredAcknowledgements: [],
    recentAnnouncements: [],
    todayEvents: [],
    weekEvents: [],
    followedStudentsCount: 0,
    error,
  };
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return emptyDashboardData('dashboard.error.noSession');
  }

  const [
    profileResult,
    superAdminResult,
    announcementsResult,
    todayEventsResult,
    weekEventsResult,
    followedStudentsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase.rpc('current_user_is_super_admin'),
    supabase
      .from('announcements')
      .select(ANNOUNCEMENT_SELECT)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('calendar_events')
      .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id, updated_at')
      .lt('starts_at', addDays(startOfLocalDay(now), 1).toISOString())
      .gt('ends_at', startOfLocalDay(now).toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id, updated_at')
      .gte('starts_at', now.toISOString())
      .lt('starts_at', addDays(now, 7).toISOString())
      .order('starts_at', { ascending: true })
      .limit(4),
    supabase
      .from('followed_students')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id),
  ]);

  if (profileResult.error || !profileResult.data) {
    return emptyDashboardData('dashboard.error.noProfile');
  }

  const announcements = announcementsResult.error
    ? []
    : ((announcementsResult.data ?? []) as AnnouncementRow[]).map(
        normalizeAnnouncement
      );

  const acknowledgementCandidates = announcements.filter(
    (announcement) => announcement.requires_acknowledgement
  );

  let readAnnouncementIds = new Set<string>();
  if (acknowledgementCandidates.length > 0) {
    const readsResult = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('profile_id', user.id)
      .in(
        'announcement_id',
        acknowledgementCandidates.map((announcement) => announcement.id)
      );

    if (!readsResult.error) {
      readAnnouncementIds = new Set(
        (readsResult.data ?? []).map((read) => read.announcement_id)
      );
    }
  }

  return {
    profile: {
      id: profileResult.data.id,
      fullName: profileResult.data.full_name,
    },
    isSuperAdmin: Boolean(superAdminResult.data),
    requiredAcknowledgements: acknowledgementCandidates.filter(
      (announcement) => !readAnnouncementIds.has(announcement.id)
    ),
    recentAnnouncements: announcements,
    todayEvents: todayEventsResult.error
      ? []
      : ((todayEventsResult.data ?? []) as DashboardCalendarEvent[]),
    weekEvents: weekEventsResult.error
      ? []
      : ((weekEventsResult.data ?? []) as DashboardCalendarEvent[]),
    followedStudentsCount: followedStudentsResult.error
      ? 0
      : (followedStudentsResult.count ?? 0),
    error: null,
  };
}
