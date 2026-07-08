'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { followStudent, unfollowStudent } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type FollowButtonProps = {
  studentId: string;
  isFollowed: boolean;
};

export function FollowButton({ studentId, isFollowed }: FollowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const action = isFollowed ? unfollowStudent : followStudent;
      const result = await action(studentId);

      if (!result.success) {
        setError(result.error ? t(result.error) : t(isFollowed ? 'students.follow.errorUnfollow' : 'students.follow.errorFollow'));
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isFollowed
            ? 'bg-accent-soft text-accent hover:bg-accent-soft/80'
            : 'bg-surface-sunken text-ink-secondary hover:bg-surface-sunken/80'
        }`}
        type="button"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowed ? (
          <Bell className="h-3.5 w-3.5 fill-current" />
        ) : (
          <BellOff className="h-3.5 w-3.5" />
        )}
        <span>
          {isFollowed
            ? t('students.follow.following')
            : t('students.follow.buttonFollow')}
        </span>
      </button>
      {error ? (
        <p className="text-[10px] font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
