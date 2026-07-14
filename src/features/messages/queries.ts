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
  const [announcementsResult, notificationsResult] = await Promise.all([
    getAnnouncements(),
    getNotifications(),
  ]);

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
