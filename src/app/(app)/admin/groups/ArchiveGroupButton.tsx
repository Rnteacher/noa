'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { setGroupActiveState } from '@/features/groups/admin-actions';
import { t } from '@/lib/i18n';

type ArchiveGroupButtonProps = {
  groupId: string;
  name: string;
  isActive: boolean;
};

export function ArchiveGroupButton({ groupId, name, isActive }: ArchiveGroupButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const confirmMessage = isActive
      ? t('admin.groups.archiveConfirm', { name })
      : t('admin.groups.activateConfirm', { name });
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await setGroupActiveState(groupId, !isActive);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error ? t(result.error) : t('admin.groups.errorUpdateFailed'));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? t('admin.groups.archiveButton') : t('admin.groups.activateButton')}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-accent disabled:opacity-40 dark:hover:bg-ink-secondary"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Archive className="h-4 w-4" />
      ) : (
        <ArchiveRestore className="h-4 w-4" />
      )}
    </button>
  );
}
