import { Inbox, Search } from 'lucide-react';
import {
  Alert,
  AppHeader,
  Card,
  EmptyState,
  ListRow,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  StatusBadge,
} from '@/components/ui';
import { t } from '@/lib/i18n';

/**
 * Internal component showcase for the base UI kit. Protected like every
 * other app route by src/proxy.ts; renders static examples only, so it is
 * independent of seed data. Section headings are component identifiers,
 * not user-facing copy. The bottom nav comes from the shared (app) layout.
 */
export default function UiShowcasePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <AppHeader
        title={t('app.title')}
        backHref="/calendar"
        trailing={
          <span className="flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary">
            <Search aria-hidden="true" className="h-5 w-5" />
          </span>
        }
      />

      <main className="flex-1 space-y-6 p-4">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">StatusBadge</h2>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="positive" label={t('status.positive')} />
              <StatusBadge variant="caution" label={t('status.caution')} />
              <StatusBadge variant="critical" label={t('status.critical')} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge
                variant="positive"
                label={t('status.positive')}
                size="sm"
              />
              <StatusBadge
                variant="caution"
                label={t('status.caution')}
                size="sm"
              />
              <StatusBadge
                variant="critical"
                label={t('status.critical')}
                size="sm"
                hideLabel
              />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">Card</h2>
          <Card
            title={t('mock.announcement.title1')}
            description={t('mock.announcement.body1')}
          >
            <p className="text-xs text-ink-muted">
              {t('mock.author.management')}
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">ListRow</h2>
          <Card className="divide-y divide-line p-0">
            <ListRow
              href="/calendar"
              title={t('mock.student.name1')}
              subtitle={t('mock.student.project1')}
              leading={
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink-secondary">
                  {t('mock.student.initial1')}
                </span>
              }
              trailing={
                <StatusBadge
                  variant="positive"
                  label={t('status.positive')}
                  size="sm"
                  hideLabel
                />
              }
            />
            <ListRow
              title={t('mock.student.name2')}
              subtitle={t('mock.student.project2')}
              leading={
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken font-bold text-ink-secondary">
                  {t('mock.student.initial2')}
                </span>
              }
              trailing={
                <StatusBadge
                  variant="caution"
                  label={t('status.caution')}
                  size="sm"
                  hideLabel
                />
              }
            />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">Alert</h2>
          <div className="space-y-2">
            <Alert variant="info" title={t('mock.announcement.title2')}>
              {t('mock.announcement.body2')}
            </Alert>
            <Alert variant="success" title={t('announcements.acknowledged')} />
            <Alert
              variant="warning"
              title={t('announcements.requiredAcknowledge')}
            />
            <Alert variant="danger" title={t('status.critical')} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">EmptyState</h2>
          <EmptyState
            icon={<Inbox aria-hidden="true" className="h-6 w-6" />}
            title={t('admin.accessGrants.empty')}
            description={t('common.searchPlaceholder')}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-muted">Skeleton</h2>
          <Card>
            <div className="flex items-center gap-3">
              <SkeletonCircle />
              <div className="flex-1">
                <SkeletonText lines={2} />
              </div>
            </div>
            <Skeleton className="mt-4 h-24 w-full" />
          </Card>
        </section>
      </main>
    </div>
  );
}
