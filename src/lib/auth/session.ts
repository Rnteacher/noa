import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AppAccessState } from '@/lib/auth/access';
import { isEmailDomainAllowed } from '@/lib/auth/access';

export async function getCurrentAccessState(): Promise<AppAccessState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 'anonymous';
  }

  if (!user.email || !isEmailDomainAllowed(user.email)) {
    return 'access_denied';
  }

  const { data, error } = await supabase.rpc('current_user_is_active_staff');

  if (error) {
    // Operational/DB failure, not a confirmed inactive profile — do not
    // misclassify as access_pending (same principle as src/proxy.ts).
    return 'lookup_error';
  }

  if (!data) {
    return 'access_pending';
  }

  return 'authorized';
}
