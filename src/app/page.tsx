import { redirect } from 'next/navigation';
import { getCurrentAccessState } from '@/lib/auth/session';
import { t } from '@/lib/i18n';

export default async function RootPage() {
  const accessState = await getCurrentAccessState();

  if (accessState === 'authorized') {
    redirect('/calendar');
  }

  if (accessState === 'access_denied') {
    redirect('/access-denied');
  }

  if (accessState === 'access_pending') {
    redirect('/access-pending');
  }

  if (accessState === 'lookup_error') {
    // A transient profile/role lookup failure, not a real access
    // decision (see src/lib/auth/session.ts). Do not sign the user out
    // or send them to /login over an operational error — render a
    // non-destructive message instead, preserving the session so a
    // reload can succeed once the underlying failure clears.
    return (
      <main className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-sm text-ink-secondary">{t('common.temporaryError')}</p>
      </main>
    );
  }

  redirect('/login');
}
