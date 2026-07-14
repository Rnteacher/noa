import 'server-only';
import { getAnnouncements } from '@/features/announcements/queries';
import { getNotifications } from '@/features/notifications/queries';
import { t } from '@/lib/i18n';
import type { MessageFeedData, MessageFeedItem } from './types';

/**
 * Merges announcements and student-update notifications into one
 * date-sorted feed, matching the Staff App Redesign mockup's Messages tab
 * (MESSAGES_DATA: kind 'announcement' | 'update').
 */
export async function getMessagesFeed(): Promise<MessageFeedData> {
  // Sequential, not Promise.all: each of these creates its own Supabase
  // client and independently calls auth.getUser(). Running them concurrently
  // risks two simultaneous token-refresh attempts racing on the same
  // refresh token (GoTrue rotates it on use), which can invalidate the
  // session and force a re-login on the next request.
  const announcementsResult = await getAnnouncements();
  const notificationsResult = await getNotifications();

  if (announcementsResult.error && notificationsResult.error) {
    return { items: [], error: announcementsResult.error };
  }

  const announcementItems: MessageFeedItem[] = announcementsResult.announcements.map(
    (announcement) => ({
      id: announcement.id,
      kind: 'announcement',
      title: announcement.title,
      subtitle: announcement.author_name
        ? t('dashboard.announcements.byAuthor', { author: announcement.author_name })
        : t('dashboard.announcements.noAuthor'),
      date: announcement.published_at,
      pinned: announcement.is_pinned,
      unread: false,
      badge:
        announcement.requires_acknowledgement && !announcement.acknowledged
          ? { label: t('announcements.requiredAcknowledge'), variant: 'caution' }
          : null,
      href: `/messages/${announcement.id}`,
    })
  );

  const updateItems: MessageFeedItem[] = notificationsResult.notifications.map(
    (notification) => ({
      id: notification.id,
      kind: 'update',
      title: notification.title,
      subtitle: notification.body ?? t('messages.update.genericSubtitle'),
      date: notification.created_at,
      pinned: false,
      unread: !notification.read_at,
      badge: null,
      href: notification.deep_link,
    })
  );

  const items = [...announcementItems, ...updateItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { items, error: null };
}
