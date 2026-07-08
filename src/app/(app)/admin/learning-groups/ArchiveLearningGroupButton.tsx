'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2 } from 'lucide-react';
import { archiveLearningGroup } from '@/features/learning-groups/admin-actions';
import { t } from '@/lib/i18n';

type ArchiveLearningGroupButtonProps = {
  learningGroupId: string;
  title: string;
  isActive: boolean;
};

export function ArchiveLearningGroupButton({
  learningGroupId,
  title,
  isActive,
}: ArchiveLearningGroupButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    const confirmMessage = t('admin.learningGroups.archiveConfirm', { title });
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await archiveLearningGroup(learningGroupId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error ? t(result.error) : t('admin.learningGroups.errorArchiveFailed'));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isPending || !isActive}
      title={t('admin.learningGroups.archiveButton')}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-status-critical disabled:opacity-40 dark:hover:bg-zinc-800"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
    </button>
  );
}
