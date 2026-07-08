import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Announcement } from './types';

export type AdminAnnouncement = Announcement & {
  readCount: number;
};

export type AdminAnnouncementsData = {
  announcements: AdminAnnouncement[];
  groups: { id: string; name: string }[];
  isAuthorized: boolean;
  error: string | null;
};

type AdminAnnouncementRow = {
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

export async function getAdminAnnouncements(): Promise<AdminAnnouncementsData> {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { announcements: [], groups: [], isAuthorized: false, error: 'dashboard.error.noSession' };
  }

  // 2. Check permissions (must be leadership or above to view admin console)
  const { data: isLeadership, error: permissionError } = await supabase.rpc(
    'current_user_is_leadership_or_above'
  );

  if (permissionError || !isLeadership) {
    return { announcements: [], groups: [], isAuthorized: false, error: 'announcements.error.forbidden' };
  }

  // 3. Fetch announcements (ordered by published_at DESC)
  const { data: announcementsData, error: annError } = await supabase
    .from('announcements')
    .select(`
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
    `)
    .order('published_at', { ascending: false });

  if (annError) {
    console.error('Failed to load admin announcements:', annError);
    return { announcements: [], groups: [], isAuthorized: true, error: 'announcements.error.failedToLoad' };
  }

  // 4. Fetch read counts (RLS will handle row filtering)
  const { data: readsData, error: readsError } = await supabase
    .from('announcement_reads')
    .select('announcement_id');

  const readCounts = new Map<string, number>();
  if (!readsError && readsData) {
    for (const r of readsData) {
      readCounts.set(r.announcement_id, (readCounts.get(r.announcement_id) ?? 0) + 1);
    }
  }

  const announcements: AdminAnnouncement[] = (announcementsData as unknown as AdminAnnouncementRow[] ?? []).map((row) => {
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
      readCount: readCounts.get(row.id) ?? 0,
    };
  });

  // 5. Fetch student groups for targeting checkbox selector
  const { data: groupsData } = await supabase
    .from('student_groups')
    .select('id, name')
    .order('name');

  return {
    announcements,
    groups: groupsData ?? [],
    isAuthorized: true,
    error: null
  };
}
