import { env } from '@/lib/env';
import type { Database } from '@/types/supabase';

export type AppRole = Database['public']['Enums']['app_role'];

export type AppAccessState =
  | 'authorized'
  | 'anonymous'
  | 'access_denied'
  | 'access_pending';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const atIndex = normalizedEmail.lastIndexOf('@');

  if (atIndex === -1) {
    return null;
  }

  return normalizedEmail.slice(atIndex + 1);
}

export function isEmailDomainAllowed(email: string) {
  const domain = getEmailDomain(email);
  const allowedDomain = env.GOOGLE_ALLOWED_DOMAIN.trim().toLowerCase();

  return Boolean(domain && allowedDomain && domain === allowedDomain);
}
