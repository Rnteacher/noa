import { Alert, AppHeader, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui';
import { getMessagesFeed } from '@/features/messages/queries';
import type { MessageFeedItem } from '@/features/messages/types';
import { t } from '@/lib/i18n';

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'numeric',
});

function MessageIcon({ item }: { item: MessageFeedItem }) {
  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-accent-soft text-accent">
      {item.kind === 'announcement' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.6 3.4a.6.6 0 0 1-.96-.48V16A3.5 3.5 0 0 1 4 12.5z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
          <circle cx="12" cy="12" r="4.4" fill="currentColor" />
        </svg>
      )}
      {item.pinned ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute -top-0.5 start-[-3px]"
        >
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" fill="currentColor" />
        </svg>
      ) : null}
      {item.kind === 'update' && item.unread ? (
        <span className="absolute -top-0.5 end-[-1px] h-2.5 w-2.5 rounded-full bg-status-critical ring-2 ring-surface-raised" />
      ) : null}
    </span>
  );
}

export default async function MessagesPage() {
  const { items, error } = await getMessagesFeed();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
      <AppHeader variant="large" title={t('nav.messages')} />

      <main className="flex-1 space-y-4 px-[18px] pb-4">
        {error ? (
          <Alert variant="warning" title={t('dashboard.error.title')}>
            {t(error)}
          </Alert>
        ) : null}

        {items.length > 0 ? (
          <Card>
            <div className="-mx-4 -my-4 divide-y divide-line">
              {items.map((item) => (
                <ListRow
                  key={`${item.kind}-${item.id}`}
                  href={item.href ?? undefined}
                  leading={<MessageIcon item={item} />}
                  title={item.title}
                  subtitle={item.subtitle}
                  trailing={
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[11.5px] font-medium text-ink-muted">
                        {dateFormatter.format(new Date(item.date))}
                      </span>
                      {item.badge ? (
                        <StatusBadge
                          variant={item.badge.variant}
                          label={item.badge.label}
                          size="sm"
                        />
                      ) : null}
                    </div>
                  }
                />
              ))}
            </div>
          </Card>
        ) : !error ? (
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.6 3.4a.6.6 0 0 1-.96-.48V16A3.5 3.5 0 0 1 4 12.5z"
                  fill="currentColor"
                />
              </svg>
            }
            title={t('messages.empty.title')}
            description={t('messages.empty.description')}
          />
        ) : null}
      </main>
    </div>
  );
}
