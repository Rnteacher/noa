import { CheckCircle, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

type SyncIndicatorProps = {
  googleCalendarEventId: string | null;
};

export function SyncIndicator({ googleCalendarEventId }: SyncIndicatorProps) {
  const isSynced = Boolean(googleCalendarEventId);
  return (
    <span
      title={isSynced ? t('admin.calendar.sync_synced') : t('admin.calendar.sync_not_synced')}
      className="inline-flex items-center justify-center p-0.5"
    >
      {isSynced ? (
        <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-450" />
      ) : (
        <AlertCircle className="h-3 w-3 text-zinc-350 dark:text-zinc-650" />
      )}
    </span>
  );
}
