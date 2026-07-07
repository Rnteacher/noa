import type { ReactNode } from 'react';
import { BottomNav } from '@/components/ui';

/**
 * Shared shell for protected app screens. The persistent bottom tab bar and
 * the spacing that keeps it from covering content live here; each page
 * renders its own header (titles and back affordances differ per screen).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
