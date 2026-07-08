import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Alert, AppHeader, EmptyState } from '@/components/ui';
import { t } from '@/lib/i18n';
import { getNotifications } from '@/features/notifications/queries';
import MarkNotificationReadButton from './MarkNotificationReadButton';
import MarkAllNotificationsReadButton from './MarkAllNotificationsReadButton';

export default async function NotificationsPage() {
  const { notifications, error } = await getNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
      <AppHeader
        title={t('notifications.title')}
        trailing={
          hasUnread ? (
            <MarkAllNotificationsReadButton label={t('notifications.markAllRead')} />
          ) : null
        }
      />

      <main className="flex-1 space-y-4 p-4">
        {error ? (
          <Alert variant="warning" title={t('dashboard.error.title')}>
            {t(error)}
          </Alert>
        ) : null}

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at;
              return (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                    isUnread
                      ? 'border-primary-100 bg-primary-50/30 dark:border-primary-900/30 dark:bg-primary-950/10'
                      : 'border-line bg-surface-raised'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 text-start">
                      <div className="flex items-center gap-2">
                        {isUnread ? (
                          <span
                            className="h-2 w-2 rounded-full bg-primary-500 shrink-0"
                            aria-hidden="true"
                          />
                        ) : null}
                        <h3 className={`text-sm font-bold text-ink ${isUnread ? 'text-primary-950 dark:text-primary-50' : ''}`}>
                          {notification.title}
                        </h3>
                      </div>
                      {notification.body ? (
                        <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                          {notification.body}
                        </p>
                      ) : null}
                    </div>
                    {isUnread ? (
                      <MarkNotificationReadButton
                        notificationId={notification.id}
                        label={t('notifications.markRead')}
                      />
                    ) : null}
                  </div>

                  {notification.deep_link ? (
                    <div className="flex justify-end mt-1">
                      <Link
                        href={notification.deep_link}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
                      >
                        {t('common.view')}
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Bell aria-hidden="true" className="h-6 w-6 text-ink-muted" />}
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyDescription')}
          />
        )}
      </main>
    </div>
  );
}
