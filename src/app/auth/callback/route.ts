import { NextResponse, type NextRequest } from 'next/server';
import { isEmailDomainAllowed } from '@/lib/auth/access';
import { syncProfileAfterOAuth } from '@/lib/auth/profile';
import { createClient } from '@/lib/supabase/server';

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return redirectTo(request, '/access-denied');
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    await supabase.auth.signOut();
    return redirectTo(request, '/access-denied');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    await supabase.auth.signOut();
    return redirectTo(request, '/access-denied');
  }

  if (!isEmailDomainAllowed(user.email)) {
    await supabase.auth.signOut();
    return redirectTo(request, '/access-denied');
  }

  try {
    const syncResult = await syncProfileAfterOAuth(user);

    if (syncResult.state === 'authorized') {
      return redirectTo(request, '/calendar');
    }

    if (syncResult.state === 'access_pending') {
      return redirectTo(request, '/access-pending');
    }
  } catch (error) {
    console.error('OAuth profile sync failed:', error);
  }

  await supabase.auth.signOut();
  return redirectTo(request, '/access-denied');
}
