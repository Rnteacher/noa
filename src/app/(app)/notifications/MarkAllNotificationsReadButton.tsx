'use client';

import { useTransition } from 'react';
import { markAllNotificationsRead } from '@/features/notifications/actions';

type Props = {
  label: string;
};

export default function MarkAllNotificationsReadButton({ label }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  };

  return (
    <button
      onClick={handleMarkAllRead}
      disabled={isPending}
      className="text-sm px-4 py-2 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm transition-colors duration-200 disabled:opacity-50"
    >
      {isPending ? '...' : label}
    </button>
  );
}
