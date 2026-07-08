'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteStudentMessage } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type Props = {
  studentId: string;
  messageId: string;
};

export function DeleteMessageButton({ studentId, messageId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    const confirmed = window.confirm(t('students.messages.deleteConfirm'));
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteStudentMessage(studentId, messageId);
      if (!res.success) {
        setError(res.error ? t(res.error) : t('students.messages.deleteFailed'));
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? (
        <span className="text-[10px] font-semibold text-status-critical">{error}</span>
      ) : null}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title={t('students.messages.deleteButton')}
        aria-label={t('students.messages.deleteButton')}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-status-critical-soft hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
