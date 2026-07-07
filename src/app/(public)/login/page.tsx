import { redirect } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { t } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env.server';

async function signInWithGoogle() {
  'use server';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${serverEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        hd: serverEnv.GOOGLE_ALLOWED_DOMAIN,
      },
    },
  });

  if (error || !data.url) {
    redirect('/access-denied');
  }

  redirect(data.url);
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-emerald-500/20">
            C
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-6">
              {t('auth.login.description')}
            </p>
          </div>
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {t('auth.login.googleButton')}
          </button>
        </form>

        <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center leading-5">
          {t('auth.login.staffOnly')}
        </p>
      </section>
    </main>
  );
}
