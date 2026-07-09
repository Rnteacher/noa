'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type PushSubscriptionInput = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export type PushSubscriptionActionResult = {
  success: boolean;
  error: string | null;
};

function normalizeEndpoint(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const endpoint = value.trim();
  if (endpoint.length < 20 || endpoint.length > 2048) {
    return null;
  }

  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }

  return endpoint;
}

function normalizeKey(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const key = value.trim();
  if (key.length < 8 || key.length > 512) {
    return null;
  }

  return key;
}

function normalizeExpirationTime(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return new Date(value).toISOString();
}

export async function savePushSubscription(
  input: PushSubscriptionInput
): Promise<PushSubscriptionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { data: isActiveStaff, error: activeStaffError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeStaffError || !isActiveStaff) {
    return { success: false, error: 'dashboard.error.noProfile' };
  }

  const endpoint = normalizeEndpoint(input.endpoint);
  const p256dhKey = normalizeKey(input.keys?.p256dh);
  const authKey = normalizeKey(input.keys?.auth);

  if (!endpoint || !p256dhKey || !authKey) {
    return { success: false, error: 'notifications.push.errorInvalidSubscription' };
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        profile_id: user.id,
        endpoint,
        p256dh_key: p256dhKey,
        auth_key: authKey,
        expiration_time: normalizeExpirationTime(input.expirationTime),
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Failed to save push subscription:', error);
    return { success: false, error: 'notifications.push.errorEnableFailed' };
  }

  revalidatePath('/notifications');
  revalidatePath('/more');

  return { success: true, error: null };
}

export async function deletePushSubscription(
  endpointInput: unknown
): Promise<PushSubscriptionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const endpoint = normalizeEndpoint(endpointInput);
  if (!endpoint) {
    return { success: false, error: 'notifications.push.errorInvalidSubscription' };
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('profile_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Failed to delete push subscription:', error);
    return { success: false, error: 'notifications.push.errorDisableFailed' };
  }

  revalidatePath('/notifications');
  revalidatePath('/more');

  return { success: true, error: null };
}

export async function deleteAllMyPushSubscriptions(): Promise<PushSubscriptionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('profile_id', user.id);

  if (error) {
    console.error('Failed to delete all push subscriptions:', error);
    return { success: false, error: 'notifications.push.errorDisableFailed' };
  }

  revalidatePath('/notifications');
  revalidatePath('/more');

  return { success: true, error: null };
}
