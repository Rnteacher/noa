import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default('http://localhost:3000'),
  GOOGLE_ALLOWED_DOMAIN: z.string().min(1).default('chamama.org.il'),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  // Server-only (no NEXT_PUBLIC_ prefix, never sent to the client bundle).
  // Gates the temporary structured auth-decision logging in src/proxy.ts.
  // Unset/anything other than "true" = disabled.
  AUTH_DIAGNOSTICS_ENABLED: z.string().optional(),
});

const envData = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  GOOGLE_ALLOWED_DOMAIN: process.env.GOOGLE_ALLOWED_DOMAIN || 'chamama.org.il',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  AUTH_DIAGNOSTICS_ENABLED: process.env.AUTH_DIAGNOSTICS_ENABLED,
};

const parsed = envSchema.safeParse(envData);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
}

export const env = parsed.success
  ? parsed.data
  : (envData as z.infer<typeof envSchema>);
