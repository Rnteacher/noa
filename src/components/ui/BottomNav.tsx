'use client';

import { CalendarDays, Ellipsis, Home, Megaphone, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { href: '/today', labelKey: 'nav.today', icon: CalendarDays },
  { href: '/students', labelKey: 'nav.students', icon: Users },
  { href: '/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { href: '/more', labelKey: 'nav.more', icon: Ellipsis },
] as const;

/**
 * Persistent mobile tab bar with the five app slots. Detail screens are
 * expected to push over it; badges (unread counts) are deferred until the
 * data layer exists.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface-raised/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive
                  ? 'font-bold text-accent'
                  : 'font-medium text-ink-muted hover:text-ink-secondary'
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
