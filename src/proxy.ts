import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isEmailDomainAllowed } from '@/lib/auth/access';
import { env } from '@/lib/env';

const PUBLIC_PATHS = ['/login', '/access-denied', '/access-pending'];
const AUTH_INTERNAL_PATHS = ['/auth/callback', '/auth/sign-out'];

const AUTH_COOKIE_PREFIX = 'sb-';
const AUTH_COOKIE_INFIX = 'auth-token';

type AuthReason =
  | 'no_claims'
  | 'claims_error'
  | 'background_claims_error'
  | 'access_denied'
  | 'inactive_profile'
  | 'profile_lookup_error'
  | 'allowed';

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isAuthInternalPath(pathname: string) {
  return AUTH_INTERNAL_PATHS.some((path) => pathname.startsWith(path));
}

function isBackgroundAuthRequest(request: NextRequest): boolean {
  const headers = request.headers;

  // RSC request (Next.js data fetch)
  if (headers.has('RSC') || headers.has('rsc')) {
    return true;
  }

  // Next.js Link prefetch
  if (
    headers.has('Next-Router-Prefetch') ||
    headers.has('next-router-prefetch') ||
    headers.get('Purpose') === 'prefetch' ||
    headers.get('purpose') === 'prefetch' ||
    headers.get('Sec-Purpose') === 'prefetch' ||
    headers.get('sec-purpose') === 'prefetch'
  ) {
    return true;
  }

  // Next.js Router State Tree
  if (headers.has('Next-Router-State-Tree') || headers.has('next-router-state-tree')) {
    return true;
  }

  // Next.js Server Action
  if (headers.has('Next-Action') || headers.has('next-action')) {
    return true;
  }

  // Accept header checks (non-HTML request)
  const accept = headers.get('accept') || headers.get('Accept') || '';
  if (accept && !accept.includes('text/html')) {
    return true;
  }

  return false;
}

function countAuthCookieChunks(request: NextRequest) {
  return request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name.startsWith(AUTH_COOKIE_PREFIX) &&
        cookie.name.includes(AUTH_COOKIE_INFIX)
    ).length;
}

/**
 * Redirects while preserving every attribute Supabase wrote onto the
 * cookies during this request's claims validation/refresh — not just
 * name+value. `ResponseCookies.getAll()` returns full cookie objects
 * (path/httpOnly/secure/sameSite/maxAge included); forwarding only the
 * name and value re-issues a freshly-refreshed auth cookie as a
 * session-lifetime, possibly-insecure cookie on every redirect, which is
 * a real bug the previous implementation had (git history: it did
 * `response.cookies.set(cookie.name, cookie.value)`).
 */
function redirectWithCookies(
  request: NextRequest,
  path: string,
  sourceResponse: NextResponse
) {
  const response = NextResponse.redirect(new URL(path, request.url));

  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

/**
 * Structured, privacy-safe diagnostic logging for the proxy's auth
 * decisions (temporary — for diagnosing the production session-loss bug
 * via Vercel logs). Gated behind AUTH_DIAGNOSTICS_ENABLED (server-only env
 * var, unset by default) so nothing is logged in normal operation. Never
 * logs cookie values, tokens, JWT contents, headers, email addresses, or
 * user IDs — only cookie name/chunk counts, pathnames, a normalized error
 * code, and a reason category.
 */
function logAuthDecision(params: {
  requestId: string;
  pathname: string;
  method: string;
  hasAuthCookie: boolean;
  authCookieChunks: number;
  claimsOk: boolean;
  errorCode: string | null;
  cookiesWritten: number;
  outcome: 'next' | 'redirect';
  redirectPath: string | null;
  reason: AuthReason;
}) {
  if (env.AUTH_DIAGNOSTICS_ENABLED !== 'true') {
    return;
  }

  console.log('[proxy-auth]', JSON.stringify(params));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAuthInternalPath(pathname)) {
    return NextResponse.next();
  }

  const requestId = crypto.randomUUID();
  const method = request.method;
  const authCookieChunks = countAuthCookieChunks(request);
  const hasAuthCookie = authCookieChunks > 0;
  const isPublic = isPublicPath(pathname);

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          // Required so a response that carries a freshly-refreshed
          // Set-Cookie is never cached by Vercel's edge/CDN layer and
          // replayed on a later request. This was previously silently
          // dropped because `setAll` only declared one parameter.
          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        },
      },
    }
  );

  // getClaims() (not getUser()/getSession()): this project's tokens use
  // asymmetric (ES256) signing, so claims are verified locally via
  // WebCrypto/JWKS instead of a network round-trip to the Auth server on
  // every request, and it still transparently refreshes first if the
  // access token is near/at expiry.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData) {
    const isBackground = isBackgroundAuthRequest(request);
    const reason: AuthReason = !hasAuthCookie
      ? 'no_claims'
      : isBackground
      ? 'background_claims_error'
      : 'claims_error';
    const shouldPassThrough = isPublic || (hasAuthCookie && isBackground);

    logAuthDecision({
      requestId,
      pathname,
      method,
      hasAuthCookie,
      authCookieChunks,
      claimsOk: false,
      errorCode: claimsError?.code ?? claimsError?.name ?? null,
      cookiesWritten: response.cookies.getAll().length,
      outcome: shouldPassThrough ? 'next' : 'redirect',
      redirectPath: shouldPassThrough ? null : '/login',
      reason,
    });

    if (shouldPassThrough) {
      return response;
    }

    return redirectWithCookies(request, '/login', response);
  }

  const { claims } = claimsData;
  const email = claims.email;

  if (!email || !isEmailDomainAllowed(email)) {
    logAuthDecision({
      requestId,
      pathname,
      method,
      hasAuthCookie,
      authCookieChunks,
      claimsOk: true,
      errorCode: null,
      cookiesWritten: response.cookies.getAll().length,
      outcome: pathname === '/access-denied' ? 'next' : 'redirect',
      redirectPath: pathname === '/access-denied' ? null : '/access-denied',
      reason: 'access_denied',
    });

    if (pathname === '/access-denied') {
      return response;
    }

    return redirectWithCookies(request, '/access-denied', response);
  }

  const { data: isActiveStaff, error: staffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (staffError) {
    // Operational/DB failure, not an access decision. Do not sign the
    // user out or force a redirect over a transient RPC error — pass the
    // already-valid, already-refreshed session through untouched and let
    // the page render (RLS still protects the underlying data regardless
    // of what this routing check would have said).
    logAuthDecision({
      requestId,
      pathname,
      method,
      hasAuthCookie,
      authCookieChunks,
      claimsOk: true,
      errorCode: staffError.code ?? staffError.message ?? null,
      cookiesWritten: response.cookies.getAll().length,
      outcome: 'next',
      redirectPath: null,
      reason: 'profile_lookup_error',
    });

    return response;
  }

  if (isActiveStaff) {
    if (isPublic || pathname === '/') {
      logAuthDecision({
        requestId,
        pathname,
        method,
        hasAuthCookie,
        authCookieChunks,
        claimsOk: true,
        errorCode: null,
        cookiesWritten: response.cookies.getAll().length,
        outcome: 'redirect',
        redirectPath: '/calendar',
        reason: 'allowed',
      });

      return redirectWithCookies(request, '/calendar', response);
    }

    logAuthDecision({
      requestId,
      pathname,
      method,
      hasAuthCookie,
      authCookieChunks,
      claimsOk: true,
      errorCode: null,
      cookiesWritten: response.cookies.getAll().length,
      outcome: 'next',
      redirectPath: null,
      reason: 'allowed',
    });

    return response;
  }

  if (pathname === '/access-pending') {
    return response;
  }

  logAuthDecision({
    requestId,
    pathname,
    method,
    hasAuthCookie,
    authCookieChunks,
    claimsOk: true,
    errorCode: null,
    cookiesWritten: response.cookies.getAll().length,
    outcome: 'redirect',
    redirectPath: '/access-pending',
    reason: 'inactive_profile',
  });

  return redirectWithCookies(request, '/access-pending', response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
