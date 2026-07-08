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
  FolderOpen
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
      href: '#', 
      labelKey: 'admin.nav.groups', 
      icon: FolderOpen, 
      enabled: false 
    },
    { 
      href: '#', 
      labelKey: 'admin.nav.users', 
      icon: UserCog, 
      enabled: false 
    },
    { 
      href: '#', 
      labelKey: 'admin.nav.importExport', 
      icon: FileSpreadsheet, 
      enabled: false 
    },
    { 
      href: '#', 
      labelKey: 'admin.nav.settings', 
      icon: Settings, 
      enabled: false 
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900 border-e border-zinc-200 dark:border-zinc-800">
      {/* Header / Brand */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-base font-bold text-zinc-950 dark:text-zinc-50">
          {t('admin.nav.title')}
        </span>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label={t('nav.main')}>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.enabled && pathname === item.href;

          if (item.enabled) {
            return (
              <Link
                key={idx}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-zinc-50'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          }

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-655 cursor-not-allowed select-none"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                <span>{t(item.labelKey)}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-750">
                {t('admin.nav.placeholder')}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Footer / Exit Back To Staff App */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
        >
          <Home className="h-4 w-4 shrink-0 text-zinc-500" />
          <span>{t('admin.nav.backToStaff')}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full text-zinc-950 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-950">
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer (overlay) */}
      {isOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" 
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
        <header className="flex md:hidden h-14 items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 sticky top-0 z-30">
          <button 
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            {t('admin.nav.title')}
          </span>
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
