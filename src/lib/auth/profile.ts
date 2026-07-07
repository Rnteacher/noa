import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/auth/admin';
import type { AppAccessState, AppRole } from '@/lib/auth/access';
import { normalizeEmail } from '@/lib/auth/access';
import { serverEnv } from '@/lib/env.server';

type ProfileSyncResult = {
  state: AppAccessState;
  roles: AppRole[];
};

const BOOTSTRAP_ROLES: AppRole[] = ['super_admin', 'manager'];

function parseBootstrapEmails() {
  return new Set(
    (serverEnv.BOOTSTRAP_SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => normalizeEmail(email))
      .filter(Boolean)
  );
}

function getDisplayName(user: User, email: string) {
  const metadata = user.user_metadata || {};
  const metadataName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : null;

  return metadataName?.trim() || email.split('@')[0] || email;
}

function getAvatarUrl(user: User) {
  const metadata = user.user_metadata || {};

  if (typeof metadata.avatar_url === 'string') {
    return metadata.avatar_url;
  }

  if (typeof metadata.picture === 'string') {
    return metadata.picture;
  }

  return null;
}

async function getExistingProfileRoles(profileId: string) {
  const admin = createServiceRoleClient();

  const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('id, is_active')
        .eq('id', profileId)
        .maybeSingle(),
      admin
        .from('profile_roles')
        .select('role')
        .eq('profile_id', profileId),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (rolesError) {
    throw rolesError;
  }

  return {
    isActive: Boolean(profile?.is_active),
    roles: (roles || []).map((row) => row.role),
  };
}

async function getGrantRoles(email: string) {
  const admin = createServiceRoleClient();

  const { data: grant, error: grantError } = await admin
    .from('staff_access_grants')
    .select('id')
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle();

  if (grantError) {
    throw grantError;
  }

  if (!grant) {
    return [];
  }

  const { data: roles, error: rolesError } = await admin
    .from('staff_access_grant_roles')
    .select('role')
    .eq('grant_id', grant.id);

  if (rolesError) {
    throw rolesError;
  }

  return (roles || []).map((row) => row.role);
}

async function upsertProfile(user: User, email: string, isActive: boolean) {
  const admin = createServiceRoleClient();

  const { error } = await admin.from('profiles').upsert(
    {
      id: user.id,
      email,
      full_name: getDisplayName(user, email),
      avatar_url: getAvatarUrl(user),
      is_active: isActive,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}

async function ensureRoles(profileId: string, roles: AppRole[]) {
  if (roles.length === 0) {
    return;
  }

  const admin = createServiceRoleClient();
  const rows = roles.map((role) => ({
    profile_id: profileId,
    role,
  }));

  const { error } = await admin
    .from('profile_roles')
    .upsert(rows, { onConflict: 'profile_id,role' });

  if (error) {
    throw error;
  }
}

export async function syncProfileAfterOAuth(user: User): Promise<ProfileSyncResult> {
  if (!user.email) {
    return { state: 'access_denied', roles: [] };
  }

  const email = normalizeEmail(user.email);
  const existingAccess = await getExistingProfileRoles(user.id);
  const bootstrapEmails = parseBootstrapEmails();

  if (bootstrapEmails.has(email)) {
    await upsertProfile(user, email, true);
    await ensureRoles(user.id, BOOTSTRAP_ROLES);
    return { state: 'authorized', roles: BOOTSTRAP_ROLES };
  }

  const grantRoles = await getGrantRoles(email);

  if (grantRoles.length > 0) {
    await upsertProfile(user, email, true);
    await ensureRoles(user.id, grantRoles);
    return { state: 'authorized', roles: grantRoles };
  }

  if (existingAccess.isActive && existingAccess.roles.length > 0) {
    await upsertProfile(user, email, true);
    return { state: 'authorized', roles: existingAccess.roles };
  }

  await upsertProfile(user, email, false);
  return { state: 'access_pending', roles: [] };
}
