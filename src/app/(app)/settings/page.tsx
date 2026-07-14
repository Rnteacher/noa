import Link from 'next/link';
import { cookies } from 'next/headers';
import { Bell, BellRing, ChevronLeft, LogOut, ShieldCheck } from 'lucide-react';
import { AppHeader, Avatar, Card } from '@/components/ui';
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher';
import { getCurrentProfileSummary } from '@/features/profile/queries';
import { DEFAULT_THEME, THEME_COOKIE, isThemeId } from '@/lib/theme';
import { t } from '@/lib/i18n';

export default async function SettingsPage() {
  const [profile, cookieStore] = await Promise.all([
    getCurrentProfileSummary(),
    cookies(),
  ]);
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const initialTheme = isThemeId(themeCookie) ? themeCookie : DEFAULT_THEME;
  const initials = profile?.fullName
    ? profile.fullName.trim().charAt(0)
    : t('settings.profileInitialFallback');

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
      <AppHeader variant="large" title={t('nav.settings')} />

      <main className="flex-1 space-y-4 px-[18px] pb-4">
        <div className="chm-card-shadow flex items-center gap-3.5 rounded-[18px] bg-surface-raised p-4">
          <Avatar initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-extrabold text-ink">
              {profile ? t('dashboard.greeting', { name: profile.fullName }) : t('dashboard.welcome')}
            </div>
            <div className="mt-0.5 text-[13px] text-ink-secondary">
              {t('settings.schoolName')}
            </div>
          </div>
        </div>

        {profile?.isManagerOrSuperAdmin ? (
          <Link
            href="/admin/groups"
            prefetch={false}
            className="flex items-center gap-3 rounded-[18px] border border-accent/30 bg-accent-soft/50 p-4 text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-accent">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{t('admin.nav.title')}</span>
              <span className="block text-xs text-ink-secondary">
                {t('settings.adminShortcutDescription')}
              </span>
            </span>
          </Link>
        ) : null}

        {profile?.isSuperAdmin ? (
          <Link
            href="/admin/access-grants"
            prefetch={false}
            className="flex items-center gap-3 rounded-[18px] border border-accent/30 bg-accent-soft/50 p-4 text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-accent">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">
                {t('admin.accessGrants.shortLink')}
              </span>
              <span className="block text-xs text-ink-secondary">
                {t('admin.accessGrants.shortDescription')}
              </span>
            </span>
          </Link>
        ) : null}

        <div>
          <p className="mb-1.5 mt-2.5 px-1.5 text-[13px] font-bold text-ink-muted">
            {t('more.notifications')}
          </p>
          <Card className="p-0">
            <Link
              href="/notifications"
              prefetch={false}
              className="flex items-center gap-3 px-[15px] py-3.5 transition-colors hover:bg-surface-sunken"
            >
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Bell aria-hidden="true" className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">
                  {t('more.notifications')}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-ink-secondary">
                  {t('more.notificationsDescription')}
                </span>
              </span>
              <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted rtl:rotate-180" />
            </Link>
            <div className="border-t border-line">
              <Link
                href="/notifications"
                prefetch={false}
                className="flex items-center gap-3 px-[15px] py-3.5 transition-colors hover:bg-surface-sunken"
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                  <BellRing aria-hidden="true" className="h-[17px] w-[17px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">
                    {t('more.pushNotifications')}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-secondary">
                    {t('more.pushNotificationsDescription')}
                  </span>
                </span>
                <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted rtl:rotate-180" />
              </Link>
            </div>
          </Card>
        </div>

        <div>
          <p className="mb-1.5 mt-5 px-1.5 text-[13px] font-bold text-ink-muted">
            {t('settings.theme.title')}
          </p>
          <ThemeSwitcher initialTheme={initialTheme} />
        </div>

        <Link
          href="/auth/sign-out"
          prefetch={false}
          className="chm-card-shadow flex w-full items-center justify-center gap-2 rounded-[16px] bg-surface-raised p-[15px] text-[15px] font-bold text-status-critical transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOut aria-hidden="true" className="h-[17px] w-[17px]" />
          <span>{t('auth.common.signOut')}</span>
        </Link>
      </main>
    </div>
  );
}
