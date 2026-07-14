'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { acknowledgeAnnouncement } from '@/features/announcements/actions';
import { t } from '@/lib/i18n';

type Props = {
  announcementId: string;
  initialAcknowledged: boolean;
};

export function AcknowledgeButton({ announcementId, initialAcknowledged }: Props) {
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAcknowledge = () => {
    setError(null);
    startTransition(async () => {
      const res = await acknowledgeAnnouncement(announcementId);
      if (res.success) {
        setAcknowledged(true);
      } else {
        setError(res.error ? t(res.error) : t('announcements.error.failedToAcknowledge'));
      }
    });
  };

  if (acknowledged) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-status-positive-soft/40 p-4 text-status-positive border border-status-positive/20">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span className="text-sm font-bold">{t('announcements.acknowledged')}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {error ? (
        <p className="text-center text-xs font-medium text-status-critical">{error}</p>
      ) : null}
      <button
        onClick={handleAcknowledge}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent p-4 text-sm font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span>{t('announcements.acknowledge')}</span>
        )}
      </button>
    </div>
  );
}
