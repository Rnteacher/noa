'use client';

import { Bell, BellOff } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Alert } from '@/components/ui';
import { t } from '@/lib/i18n';
import {
  deletePushSubscription,
  savePushSubscription,
} from '@/features/notifications/push-actions';

type PushControlStatus = 'unsupported' | 'default' | 'granted' | 'denied';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export default function PushSubscriptionControls() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [status, setStatus] = useState<PushControlStatus>('unsupported');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAvailable = useMemo(
    () => Boolean(vapidPublicKey && isPushSupported()),
    [vapidPublicKey]
  );

  useEffect(() => {
    if (!isAvailable) {
      return;
    }

    let isMounted = true;

    async function inspectSubscription() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.getSubscription();
        if (!isMounted) {
          return;
        }
        setStatus(Notification.permission);
        setHasSubscription(Boolean(subscription));
      } catch (error) {
        console.error('Failed to inspect push subscription:', error);
      }
    }

    void inspectSubscription();

    return () => {
      isMounted = false;
    };
  }, [isAvailable]);

  function enableNotifications() {
    if (!isAvailable || !vapidPublicKey) {
      setStatus('unsupported');
      return;
    }

    setMessageKey(null);

    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        setStatus(permission);

        if (permission !== 'granted') {
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription =
          existingSubscription ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          }));

        const result = await savePushSubscription(subscription.toJSON());
        if (!result.success) {
          setMessageKey(result.error ?? 'notifications.push.errorEnableFailed');
          return;
        }

        setHasSubscription(true);
        setMessageKey('notifications.push.saved');
      } catch (error) {
        console.error('Failed to enable push notifications:', error);
        setMessageKey('notifications.push.errorEnableFailed');
      }
    });
  }

  function disableNotifications() {
    if (!isAvailable) {
      return;
    }

    setMessageKey(null);

    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          setHasSubscription(false);
          setMessageKey('notifications.push.disabled');
          return;
        }

        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const result = await deletePushSubscription(endpoint);

        if (!result.success) {
          setMessageKey(result.error ?? 'notifications.push.errorDisableFailed');
          return;
        }

        setHasSubscription(false);
        setMessageKey('notifications.push.disabled');
      } catch (error) {
        console.error('Failed to disable push notifications:', error);
        setMessageKey('notifications.push.errorDisableFailed');
      }
    });
  }

  const statusText =
    status === 'granted'
      ? t('notifications.push.permissionGranted')
      : status === 'denied'
        ? t('notifications.push.permissionDenied')
        : t('notifications.push.permissionDefault');

  return (
    <section className="rounded-xl border border-line bg-surface-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-start">
          <h2 className="text-sm font-bold text-ink">
            {t('notifications.push.title')}
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-secondary">{statusText}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          {hasSubscription && status === 'granted' ? (
            <Bell aria-hidden="true" className="h-4 w-4" />
          ) : (
            <BellOff aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
      </div>

      {status === 'unsupported' ? (
        <p className="mt-3 text-xs leading-5 text-ink-secondary">
          {t('notifications.push.unsupported')}
        </p>
      ) : null}

      {status === 'denied' ? (
        <p className="mt-3 text-xs leading-5 text-ink-secondary">
          {t('notifications.push.permissionDeniedDescription')}
        </p>
      ) : null}

      {messageKey ? (
        <Alert
          variant={messageKey.includes('error') ? 'warning' : 'success'}
          className="mt-3"
        >
          {t(messageKey)}
        </Alert>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {status !== 'granted' || !hasSubscription ? (
          <button
            type="button"
            onClick={enableNotifications}
            disabled={!isAvailable || status === 'denied' || isPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bell aria-hidden="true" className="h-4 w-4" />
            {isPending
              ? t('common.loading')
              : t('notifications.push.enableNotifications')}
          </button>
        ) : (
          <>
            <span className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold text-status-positive">
              {t('notifications.push.enabled')}
            </span>
            <button
              type="button"
              onClick={disableNotifications}
              disabled={isPending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BellOff aria-hidden="true" className="h-4 w-4" />
              {isPending
                ? t('common.loading')
                : t('notifications.push.disableNotifications')}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
