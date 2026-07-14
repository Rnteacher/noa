'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  Lock,
  Calendar,
  BookOpen,
  Megaphone,
  Users,
  UserCog,
  FileSpreadsheet,
  Settings,
  FolderOpen,
  ScrollText
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      href: '/admin/access-grants',
      labelKey: 'admin.nav.accessGrants',
      icon: Lock,
      enabled: true
    },
    {
      href: '/admin/calendar',
      labelKey: 'admin.nav.calendar',
      icon: Calendar,
      enabled: true
    },
    {
      href: '/admin/learning-groups',
      labelKey: 'admin.nav.learningGroups',
      icon: BookOpen,
      enabled: true
    },
    {
      href: '/admin/announcements',
      labelKey: 'admin.nav.announcements',
      icon: Megaphone,
      enabled: true
    },
    {
      href: '#',
      labelKey: 'admin.nav.students',
      icon: Users,
      enabled: false
    },
    {
      href: '/admin/groups',
      labelKey: 'admin.nav.groups',
      icon: FolderOpen,
      enabled: true
    },
    {
      href: '#',
      labelKey: 'admin.nav.users',
      icon: UserCog,
      enabled: false
    },
    {
      href: '/admin/audit',
      labelKey: 'admin.nav.audit',
      icon: ScrollText,
      enabled: true
    },
    {
      href: '/admin/import-export',
      labelKey: 'admin.nav.importExport',
      icon: FileSpreadsheet,
      enabled: true
    },
    {
      href: '#',
      labelKey: 'admin.nav.settings',
      icon: Settings,
      enabled: false
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col border-e border-line bg-surface-raised">
      {/* Header / Brand */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-line">
        <span className="text-base font-bold text-ink">
          {t('admin.nav.title')}
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/*
        Main Nav Items. prefetch={false} on every Link in this sidebar is
        load-bearing, not an optimization: the desktop sidebar renders ~7
        links simultaneously, and Next's default viewport prefetching fires
        a background request for each one through the auth middleware at
        once. If the access token is due for a refresh right then, those
        concurrent requests race on the same (single-use) refresh token —
        one wins, the rest invalidate the session and the user gets kicked
        back to /login. Same root cause as the messages-feed fix in
        src/features/messages/queries.ts; here the fix is avoiding the
        concurrent requests in the first place.
      */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label={t('nav.main')}>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.enabled && pathname === item.href;

          if (item.enabled) {
            return (
              <Link
                key={idx}
                href={item.href}
                prefetch={false}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent' : 'text-ink-muted')} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          }

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-ink-muted cursor-not-allowed select-none"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-ink-muted/60" />
                <span>{t(item.labelKey)}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted/60">
                {t('admin.nav.placeholder')}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Footer / Exit Back To Staff App */}
      <div className="p-3 border-t border-line">
        <Link
          href="/calendar"
          prefetch={false}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-sunken hover:text-ink transition-colors"
        >
          <Home className="h-4 w-4 shrink-0 text-ink-muted" />
          <span>{t('admin.nav.backToStaff')}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-surface text-ink">
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer (overlay) */}
      {isOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="relative flex w-64 max-w-xs flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden h-14 items-center justify-between px-4 bg-surface-raised border-b border-line shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-ink">
            {t('admin.nav.title')}
          </span>
          <Link
            href="/calendar"
            prefetch={false}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken"
          >
            <Home className="h-5 w-5" />
          </Link>
        </header>

        {/* Page children container */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
