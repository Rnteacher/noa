import type { AppRole } from '@/lib/auth/access';

export const APP_ROLES = [
  'staff',
  'mentor',
  'master',
  'counselor',
  'leadership',
  'manager',
  'super_admin',
] as const satisfies readonly AppRole[];
