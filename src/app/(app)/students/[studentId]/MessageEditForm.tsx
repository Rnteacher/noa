'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { updateStudentMessage } from '@/features/students/actions';
import { t } from '@/lib/i18n';

const ALLOWED_TAGS = ['general', 'project', 'emotional', 'attendance', 'family', 'incident'] as const;

type MessageEditFormProps = {
  studentId: string;
  messageId: string;
  currentBody: string;
  currentTag: typeof ALLOWED_TAGS[number] | null;
  currentIsImportant: boolean;
};

export function MessageEditForm({
  studentId,
  messageId,
  currentBody,
  currentTag,
  currentIsImportant,
}: MessageEditFormProps) {
  const bodyId = useId();
  const tagId = useId();
  const router = useRouter();
  const [body, setBody] = useState(currentBody);
  const [tag, setTag] = useState<typeof ALLOWED_TAGS[number]>(currentTag ?? 'general');
  const [isImportant, setIsImportant] = useState(currentIsImportant);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanged =
    body.trim() !== currentBody ||
    tag !== (currentTag ?? 'general') ||
    isImportant !== currentIsImportant;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!body.trim()) {
      setError(t('students.messages.emptyBody'));
      return;
    }

    if (!hasChanged) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateStudentMessage(studentId, messageId, body, tag, isImportant);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.messages.editFailed'));
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-line pt-3">
      <div className="space-y-1">
        <label htmlFor={bodyId} className="block text-xs font-semibold text-ink-secondary">
          {t('students.messages.editBodyLabel')}
        </label>
        <textarea
          id={bodyId}
          value={body}
          maxLength={2000}
          rows={2}
          onChange={(event) => {
            setBody(event.target.value);
            setSuccess(false);
            setError(null);
          }}
          disabled={isPending}
          className="w-full rounded-lg border border-line bg-surface-sunken px-2 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={tagId} className="block text-xs font-semibold text-ink-secondary">
            {t('students.messages.tagLabel')}
          </label>
          <select
            id={tagId}
            value={tag}
            onChange={(event) => {
              setTag(event.target.value as typeof ALLOWED_TAGS[number]);
              setSuccess(false);
              setError(null);
            }}
            disabled={isPending}
            className="h-9 w-full rounded-lg border border-line bg-surface-sunken px-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
          >
            {ALLOWED_TAGS.map((tagValue) => (
              <option key={tagValue} value={tagValue}>
                {t(`students.messages.tags.${tagValue}`)}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pt-4 text-xs font-medium text-ink-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isImportant}
            onChange={(event) => {
              setIsImportant(event.target.checked);
              setSuccess(false);
              setError(null);
            }}
            disabled={isPending}
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent disabled:opacity-50"
          />
          <span>{t('students.messages.importantToggle')}</span>
        </label>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm font-semibold text-status-positive" role="status">
          {t('students.messages.editSuccess')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !body.trim() || !hasChanged}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.messages.editButton')}</span>
      </button>
    </form>
  );
}
