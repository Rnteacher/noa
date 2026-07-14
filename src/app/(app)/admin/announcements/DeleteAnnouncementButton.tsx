'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteAnnouncementAction } from '@/features/announcements/admin-actions';
import { t } from '@/lib/i18n';

type DeleteAnnouncementButtonProps = {
  announcementId: string;
  title: string;
};

export function DeleteAnnouncementButton({ announcementId, title }: DeleteAnnouncementButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmMessage = t('admin.announcements.deleteConfirm', { title });
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAnnouncementAction(announcementId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error ? t(res.error) : t('admin.announcements.errorDeleteFailed'));
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title={t('admin.announcements.deleteButton')}
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
