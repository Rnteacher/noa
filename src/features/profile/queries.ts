import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type CurrentProfileSummary = {
  fullName: string;
  isSuperAdmin: boolean;
} | null;

/** Minimal current-staff-profile summary for the Settings tab's profile card. */
export async function getCurrentProfileSummary(): Promise<CurrentProfileSummary> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, superAdminResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase.rpc('current_user_is_super_admin'),
  ]);

  if (!profileResult.data) {
    return null;
  }

  return {
    fullName: profileResult.data.full_name,
    isSuperAdmin: Boolean(superAdminResult.data),
  };
}
