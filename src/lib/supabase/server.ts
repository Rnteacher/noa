import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from '@/lib/env';

/**
 * Memoized per-request via React's cache(): every query/action in a given
 * request that calls createClient() gets the *same* Supabase client
 * instance, so auth.getUser() only ever resolves once per request instead
 * of once per query. Without this, a page that runs several independent
 * queries (each with its own createClient() + getUser()) can, when the
 * access token happens to be near expiry, fire several concurrent refresh
 * attempts against the same single-use refresh token — one wins, the rest
 * invalidate the session and the user gets bounced to /login on the next
 * request. This was previously worked around ad hoc in one query (see git
 * history for features/messages/queries.ts); caching the client removes
 * the whole class of bug instead of one instance of it.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method can be called from a Server Component.
            // This can be ignored if proxy is refreshing
            // user sessions.
          }
        },
      },
    }
  );
});
