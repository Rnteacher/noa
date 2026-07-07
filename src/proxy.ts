import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isEmailDomainAllowed } from '@/lib/auth/access';
import { env } from '@/lib/env';

const PUBLIC_PATHS = ['/login', '/access-denied', '/access-pending'];
const AUTH_INTERNAL_PATHS = ['/auth/callback', '/auth/sign-out'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isAuthInternalPath(pathname: string) {
  return AUTH_INTERNAL_PATHS.some((path) => pathname.startsWith(path));
}

function redirectWithCookies(
  request: NextRequest,
  path: string,
  sourceResponse: NextResponse
) {
  const response = NextResponse.redirect(new URL(path, request.url));

  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value);
  });

  return response;
}

export async function proxy(request: NextRequest) {
  if (isAuthInternalPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);

  if (!user) {
    if (isPublic) {
      return response;
    }

    return redirectWithCookies(request, '/login', response);
  }

  if (!user.email || !isEmailDomainAllowed(user.email)) {
    if (pathname === '/access-denied') {
      return response;
    }

    return redirectWithCookies(request, '/access-denied', response);
  }

  const { data: isActiveStaff } = await supabase.rpc('current_user_is_active_staff');

  if (isActiveStaff) {
    if (isPublic || pathname === '/') {
      return redirectWithCookies(request, '/dashboard', response);
    }

    return response;
  }

  if (pathname === '/access-pending') {
    return response;
  }

  return redirectWithCookies(request, '/access-pending', response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
