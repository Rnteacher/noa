import { CalendarDays } from 'lucide-react';
import { AppHeader, EmptyState } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader title={t('nav.today')} />
      <main className="flex-1 p-4">
        <EmptyState
          icon={<CalendarDays aria-hidden="true" className="h-6 w-6" />}
          title={t('placeholder.comingSoon')}
          description={t('placeholder.today')}
        />
      </main>
    </div>
  );
}
