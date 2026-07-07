import { Ellipsis } from 'lucide-react';
import { AppHeader, EmptyState } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function MorePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader title={t('nav.more')} />
      <main className="flex-1 p-4">
        <EmptyState
          icon={<Ellipsis aria-hidden="true" className="h-6 w-6" />}
          title={t('placeholder.comingSoon')}
          description={t('placeholder.more')}
        />
      </main>
    </div>
  );
}
