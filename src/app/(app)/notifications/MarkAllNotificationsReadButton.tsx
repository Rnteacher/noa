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
      className="text-sm px-4 py-2 rounded-xl font-semibold bg-accent text-on-accent hover:bg-accent-strong shadow-sm transition-colors duration-200 disabled:opacity-50"
    >
      {isPending ? '...' : label}
    </button>
  );
}
