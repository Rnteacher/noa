import Link from 'next/link';
import { Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AccessPendingPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 space-y-5 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
            {t('auth.accessPending.title')}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-6">
            {t('auth.accessPending.description')}
          </p>
        </div>
        <Link
          href="/auth/sign-out"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-bold px-4 transition-colors"
        >
          {t('auth.common.signOut')}
        </Link>
      </section>
    </main>
  );
}
