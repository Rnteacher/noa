'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createGroup, updateGroup, type GroupInput } from '@/features/groups/admin-actions';
import type { AdminGroup, AdminGroupSchoolYearOption } from '@/features/groups/types';
import { t } from '@/lib/i18n';

type GroupFormProps = {
  mode: 'create' | 'edit';
  group?: AdminGroup;
  schoolYearOptions: AdminGroupSchoolYearOption[];
  onSaved: () => void;
  onCancel: () => void;
};

export function GroupForm({ mode, group, schoolYearOptions, onSaved, onCancel }: GroupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(group?.name ?? '');
  const [layer, setLayer] = useState(group?.layer ?? '');
  const [schoolYearId, setSchoolYearId] = useState(group?.schoolYearId ?? schoolYearOptions[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('admin.groups.errorNameRequired'));
      return;
    }
    if (!schoolYearId) {
      setError(t('admin.groups.errorInvalidSchoolYear'));
      return;
    }

    const input: GroupInput = { name: trimmedName, layer, schoolYearId };

    startTransition(async () => {
      const result =
        mode === 'edit' && group ? await updateGroup(group.id, input) : await createGroup(input);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.groups.errorCreateFailed'));
        return;
      }

      router.refresh();
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
          {t('admin.groups.nameLabel')}
        </span>
        <input
          type="text"
          autoFocus
          required
          disabled={isPending}
          value={name}
          maxLength={160}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('admin.groups.namePlaceholder')}
          className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
          {t('admin.groups.schoolYearLabel')}
        </span>
        <select
          required
          disabled={isPending}
          value={schoolYearId}
          onChange={(event) => setSchoolYearId(event.target.value)}
          className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none focus:border-accent"
        >
          {schoolYearOptions.length === 0 ? <option value="">{t('admin.groups.noSchoolYears')}</option> : null}
          {schoolYearOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
          {t('admin.groups.layerLabel')}
        </span>
        <input
          type="text"
          disabled={isPending}
          value={layer}
          maxLength={80}
          onChange={(event) => setLayer(event.target.value)}
          placeholder={t('admin.groups.layerPlaceholder')}
          className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      {error ? (
        <p className="text-xs font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="h-10 px-4 rounded-xl text-xs font-bold bg-surface-sunken hover:bg-line/80 text-ink-secondary dark:bg-ink-secondary dark:hover:bg-ink-secondary dark:text-line transition-colors"
        >
          {t('admin.calendar.cancelButton')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-5 rounded-xl text-xs font-bold bg-accent hover:bg-accent-strong text-white flex items-center justify-center gap-1.5 transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <span>{mode === 'edit' ? t('admin.groups.updateButton') : t('admin.groups.createButton')}</span>
        </button>
      </div>
    </form>
  );
}
