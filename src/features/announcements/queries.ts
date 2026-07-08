import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Announcement, SingleAnnouncementData } from './types';

const ANNOUNCEMENT_SELECT = `
  id,
  title,
  body,
  author_id,
  target_type,
  is_pinned,
  requires_acknowledgement,
  push_enabled,
  published_at,
  expires_at,
  created_at,
  updated_at,
  profiles:author_id(full_name)
`;

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  target_type: Announcement['target_type'];
  is_pinned: boolean;
  requires_acknowledgement: boolean;
  push_enabled: boolean;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

function normalizeAnnouncement(row: AnnouncementRow): Announcement {
  const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author_id: row.author_id,
    target_type: row.target_type,
    is_pinned: row.is_pinned,
    requires_acknowledgement: row.requires_acknowledgement,
    push_enabled: row.push_enabled,
    published_at: row.published_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: author?.full_name ?? null,
  };
}

export async function getAnnouncements(): Promise<{ announcements: Announcement[]; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { announcements: [], error: 'dashboard.error.noSession' };
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) {
    return { announcements: [], error: 'announcements.error.failedToLoad' };
  }

  const list = (data as AnnouncementRow[]).map(normalizeAnnouncement);

  const ackRequiredIds = list
    .filter((a) => a.requires_acknowledgement)
    .map((a) => a.id);

  let readAnnouncementIds = new Set<string>();
  if (ackRequiredIds.length > 0) {
    const { data: readsData, error: readsError } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('profile_id', user.id)
      .in('announcement_id', ackRequiredIds);

    if (!readsError && readsData) {
      readAnnouncementIds = new Set(readsData.map((r) => r.announcement_id));
    }
  }

  const announcements = list.map((a) => ({
    ...a,
    acknowledged: a.requires_acknowledgement ? readAnnouncementIds.has(a.id) : undefined,
  }));

  return { announcements, error: null };
}

export async function getAnnouncementById(
  id: string
): Promise<SingleAnnouncementData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { announcement: null, acknowledged: false, error: 'dashboard.error.noSession' };
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return { announcement: null, acknowledged: false, error: 'announcements.error.notFound' };
  }

  const announcement = normalizeAnnouncement(data as AnnouncementRow);

  let acknowledged = false;
  if (announcement.requires_acknowledgement) {
    const { data: readData, error: readError } = await supabase
      .from('announcement_reads')
      .select('id')
      .eq('announcement_id', id)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!readError && readData) {
      acknowledged = true;
    }
  }

  return { announcement, acknowledged, error: null };
}
