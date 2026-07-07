import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { requireServiceRoleKey, serverEnv } from '@/lib/env.server';
import type { Database } from '@/types/supabase';

export function createServiceRoleClient() {
  return createClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    requireServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
