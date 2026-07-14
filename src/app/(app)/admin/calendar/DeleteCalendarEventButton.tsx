'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCalendarEvent } from '@/features/calendar/admin-actions';
import { t } from '@/lib/i18n';

type DeleteCalendarEventButtonProps = {
  eventId: string;
  title: string;
  onDeleted?: () => void;
};

export function DeleteCalendarEventButton({ eventId, title, onDeleted }: DeleteCalendarEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmMessage = t('admin.calendar.deleteConfirm', { title });
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCalendarEvent(eventId);
      if (result.success) {
        router.refresh();
        onDeleted?.();
      } else {
        alert(result.error ? t(result.error) : t('admin.calendar.errorDeleteFailed'));
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title={t('admin.calendar.deleteButton')}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-status-critical hover:bg-surface dark:hover:bg-ink-secondary transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
