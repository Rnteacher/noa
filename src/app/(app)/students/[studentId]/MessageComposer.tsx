'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { createStudentMessage } from '@/features/students/actions';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui';

type MessageComposerProps = {
  studentId: string;
};

const ALLOWED_TAGS = ['general', 'project', 'emotional', 'attendance', 'family', 'incident'] as const;

export function MessageComposer({ studentId }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<typeof ALLOWED_TAGS[number]>('general');
  const [isImportant, setIsImportant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await createStudentMessage(studentId, body, tag, isImportant);
      if (res.success) {
        setBody('');
        setTag('general');
        setIsImportant(false);
      } else {
        setError(res.error ? t(res.error) : t('students.messages.createFailed'));
      }
    });
  };

  return (
    <Card title={t('students.messages.composerTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <p className="text-sm font-semibold text-status-critical" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="message-body" className="block text-xs font-semibold text-ink-secondary">
            {t('students.messages.bodyLabel')}
          </label>
          <textarea
            id="message-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isPending}
            placeholder={t('students.messages.bodyPlaceholder')}
            rows={3}
            className="w-full rounded-xl border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="message-tag" className="block text-xs font-semibold text-ink-secondary">
              {t('students.messages.tagLabel')}
            </label>
            <select
              id="message-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value as typeof ALLOWED_TAGS[number])}
              disabled={isPending}
              className="h-10 w-full rounded-xl border border-line bg-surface-sunken px-3 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
            >
              {ALLOWED_TAGS.map((tagValue) => (
                <option key={tagValue} value={tagValue}>
                  {t(`students.messages.tags.${tagValue}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent disabled:opacity-50"
              />
              <span>{t('students.messages.importantToggle')}</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{t('students.messages.sendButton')}</span>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
