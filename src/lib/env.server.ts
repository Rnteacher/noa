import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default('http://localhost:3000'),
  GOOGLE_ALLOWED_DOMAIN: z.string().min(1).default('chamama.org.il'),
  BOOTSTRAP_SUPER_ADMIN_EMAILS: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WEB_PUSH_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_SUBJECT: z.string().optional(),
});

const serverEnvData = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  GOOGLE_ALLOWED_DOMAIN: process.env.GOOGLE_ALLOWED_DOMAIN || 'chamama.org.il',
  BOOTSTRAP_SUPER_ADMIN_EMAILS: process.env.BOOTSTRAP_SUPER_ADMIN_EMAILS,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY,
  WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY,
  WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT,
};

const parsed = serverEnvSchema.safeParse(serverEnvData);

if (!parsed.success) {
  console.error('Invalid server environment configuration:', parsed.error.format());
}

export const serverEnv = parsed.success
  ? parsed.data
  : (serverEnvData as z.infer<typeof serverEnvSchema>);

export function requireServiceRoleKey() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for privileged server operations.');
  }

  return serverEnv.SUPABASE_SERVICE_ROLE_KEY;
}
