'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/ui';
import { AdminShell } from '@/components/layout/AdminShell';

/**
 * Shared shell for protected app screens. The persistent bottom tab bar and
 * the spacing that keeps it from covering content live here; each page
 * renders its own header (titles and back affordances differ per screen).
 *
 * If the route is an admin route, it renders the desktop-first AdminShell
 * instead of the mobile staff bottom navigation layout.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
