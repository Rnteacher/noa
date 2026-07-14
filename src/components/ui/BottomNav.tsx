'use client';

import { useState, useEffect, useRef, type SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

/**
 * Nav icons copied verbatim (path data) from the Staff App Redesign mockup
 * rather than approximated with lucide-react, since the mockup's glyphs
 * (speech-bubble messages, layered calendar, two-person students, stacked
 * sliders settings) don't have exact lucide equivalents.
 */
function MessagesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.6 3.4a.6.6 0 0 1-.96-.48V16A3.5 3.5 0 0 1 4 12.5z"
      />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="4.5" fill="currentColor" opacity="0.25" />
      <path
        fill="currentColor"
        d="M3 8.7A4.2 4.2 0 0 1 7.2 4.5h9.6A4.2 4.2 0 0 1 21 8.7v.3H3z"
      />
      <circle cx="12" cy="15" r="2.1" fill="currentColor" />
    </svg>
  );
}

function StudentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="9" cy="9.5" r="4" fill="currentColor" />
      <circle cx="16" cy="10.5" r="3.2" fill="currentColor" opacity="0.4" />
      <path fill="currentColor" d="M3 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" />
      <path
        fill="currentColor"
        opacity="0.4"
        d="M13.8 20c.3-2.5 1.9-4.2 4-4.4 2 .3 3.4 2 3.7 4.4"
      />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="4" y="6.2" width="16" height="1.8" rx="0.9" fill="currentColor" opacity="0.3" />
      <circle cx="15.5" cy="7.1" r="2.6" fill="currentColor" />
      <rect x="4" y="11.1" width="16" height="1.8" rx="0.9" fill="currentColor" opacity="0.3" />
      <circle cx="9" cy="12" r="2.6" fill="currentColor" />
      <rect x="4" y="16" width="16" height="1.8" rx="0.9" fill="currentColor" opacity="0.3" />
      <circle cx="13.5" cy="16.9" r="2.6" fill="currentColor" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/messages', labelKey: 'nav.messages', icon: MessagesIcon },
  { href: '/calendar', labelKey: 'nav.calendar', icon: CalendarIcon },
  { href: '/students', labelKey: 'nav.students', icon: StudentsIcon },
  { href: '/settings', labelKey: 'nav.settings', icon: SettingsIcon },
] as const;

/**
 * Persistent mobile tab bar with the four app slots (Staff App Redesign
 * mockup). Detail screens are expected to push over it. The unread-messages
 * badge (announcements + student-update notifications) shows on the
 * Messages tab, since that's where the merged feed now lives.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    const shouldFetch =
      pathname === '/messages' ||
      pathname === '/notifications' ||
      (prevPath !== null && (prevPath === '/messages' || prevPath === '/notifications'));

    prevPathnameRef.current = pathname;

    if (!shouldFetch) return;

    let active = true;

    // Deferred, not fired immediately on navigation: this is a separate
    // Server Action request that would otherwise race the page's own
    // navigation request. This is a mitigation, not a guarantee — it
    // reduces the odds of this specific request colliding with the page
    // navigation's own token refresh by giving that refresh a head start,
    // but it doesn't eliminate concurrent-refresh races in general (see
    // docs/30_STAFF_APP_REDESIGN_V1_FEEDBACK_FIXES.md).
    const timer = setTimeout(() => {
      import('@/features/notifications/actions')
        .then((mod) => mod.getUnreadNotificationCountAction())
        .then((count) => {
          if (active) setUnreadCount(count);
        })
        .catch((err) => console.error('Failed to load unread count in BottomNav:', err));
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-[var(--tab-bar-bg)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive
                  ? 'font-bold text-accent'
                  : 'font-medium text-ink-muted hover:text-ink-secondary'
              )}
            >
              <div className="relative">
                <Icon aria-hidden="true" className="h-5 w-5" />
                {href === '/messages' && unreadCount > 0 ? (
                  <span
                    className="absolute -top-1.5 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-critical px-1 text-[9px] font-bold text-white ring-2 ring-surface-raised"
                    aria-label={t('notifications.unread')}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </div>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
