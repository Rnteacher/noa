import { Bell, BellRing, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/ui';
import { t } from '@/lib/i18n';
import { getUnreadNotificationCount } from '@/features/notifications/queries';

export default async function MorePage() {
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
      <AppHeader title={t('nav.more')} />
      <main className="flex-1 space-y-4 p-4">
        <Link
          href="/notifications"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="text-start">
              <span className="block text-sm font-bold text-ink">
                {t('more.notifications')}
              </span>
              <span className="block text-xs text-ink-secondary">
                {t('more.notificationsDescription')}
              </span>
            </div>
          </div>
          {unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-status-critical px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <BellRing aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="text-start">
            <span className="block text-sm font-bold text-ink">
              {t('more.pushNotifications')}
            </span>
            <span className="block text-xs text-ink-secondary">
              {t('more.pushNotificationsDescription')}
            </span>
          </div>
        </Link>

        <Link
          href="/auth/sign-out"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface-raised p-4 transition-colors hover:bg-status-critical-soft/10 text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-critical-soft text-status-critical">
            <LogOut aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="text-start">
            <span className="block text-sm font-bold">
              {t('auth.common.signOut')}
            </span>
          </div>
        </Link>
      </main>
    </div>
  );
}
