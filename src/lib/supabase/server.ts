import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Plain async factory, deliberately NOT wrapped in React's cache(). This
 * helper is shared by Server Components, Server Actions, and Route
 * Handlers; cache() is a React-render-scoped optimization and must not be
 * relied on from a generic factory used outside that context. Session
 * correctness must not depend on it.
 *
 * Cross-request session-refresh correctness is handled entirely by
 * src/proxy.ts: middleware is the single authoritative place that
 * validates/refreshes the session (via getClaims()) for every request,
 * writes the refreshed cookies to both the request (so this and every
 * downstream call reads the already-fresh session) and the response (so
 * the browser gets it), and never lets a redirect drop those cookies.
 *
 * Where a single render needs more than one query helper that would each
 * otherwise call createClient() independently, create one client at the
 * call site and pass it into the subordinate helpers instead (see
 * src/features/messages/queries.ts's getMessagesFeed for an example) —
 * do not reach for cache() to paper over that.
 */
export async function createClient() {
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
}
