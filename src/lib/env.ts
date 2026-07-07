import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default('http://localhost:3000'),
  GOOGLE_ALLOWED_DOMAIN: z.string().min(1).default('chamama.org.il'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WEB_PUSH_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_SUBJECT: z.string().optional(),
});

// Since client-side components might not have access to server-side variables,
// we allow optional behavior or fallback during build/dev cycles.
const envData = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  GOOGLE_ALLOWED_DOMAIN: process.env.GOOGLE_ALLOWED_DOMAIN || 'chamama.org.il',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY,
  WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY,
  WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT,
};

const parsed = envSchema.safeParse(envData);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
}

export const env = parsed.success
  ? parsed.data
  : (envData as z.infer<typeof envSchema>);
