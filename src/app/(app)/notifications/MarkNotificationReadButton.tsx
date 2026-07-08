'use client';

import { useTransition } from 'react';
import { markNotificationRead } from '@/features/notifications/actions';

type Props = {
  notificationId: string;
  label: string;
};

export default function MarkNotificationReadButton({ notificationId, label }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleMarkRead = () => {
    startTransition(async () => {
      await markNotificationRead(notificationId);
    });
  };

  return (
    <button
      onClick={handleMarkRead}
      disabled={isPending}
      className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors duration-200"
      aria-label={label}
    >
      {isPending ? '...' : label}
    </button>
  );
}
