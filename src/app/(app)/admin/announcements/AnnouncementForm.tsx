'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Loader2 } from 'lucide-react';
import { createAnnouncementAction } from '@/features/announcements/admin-actions';
import { t } from '@/lib/i18n';

type GroupOption = {
  id: string;
  name: string;
};

type AnnouncementFormProps = {
  groups: GroupOption[];
};

const ROLES_LIST = [
  'staff',
  'mentor',
  'master',
  'counselor',
  'leadership',
  'manager',
  'super_admin',
] as const;

export function AnnouncementForm({ groups }: AnnouncementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all_staff' | 'roles' | 'groups'>('all_staff');
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);

  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRoleToggle = (role: string) => {
    const next = new Set(selectedRoles);
    if (next.has(role)) {
      next.delete(role);
    } else {
      next.add(role);
    }
    setSelectedRoles(next);
  };

  const handleGroupToggle = (groupId: string) => {
    const next = new Set(selectedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedGroups(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setError(t('admin.announcements.errorTitleRequired'));
      return;
    }
    if (!trimmedBody) {
      setError(t('admin.announcements.errorBodyRequired'));
      return;
    }

    if (targetType === 'roles' && selectedRoles.size === 0) {
      setError(t('admin.announcements.errorRolesRequired'));
      return;
    }

    if (targetType === 'groups' && selectedGroups.size === 0) {
      setError(t('admin.announcements.errorGroupsRequired'));
      return;
    }

    startTransition(async () => {
      const res = await createAnnouncementAction({
        title: trimmedTitle,
        body: trimmedBody,
        targetType,
        isPinned,
        requiresAcknowledgement,
        roles: targetType === 'roles' ? Array.from(selectedRoles) : undefined,
        groups: targetType === 'groups' ? Array.from(selectedGroups) : undefined,
      });

      if (res.success) {
        setSuccess(t('admin.announcements.createSuccess'));
        setTitle('');
        setBody('');
        setTargetType('all_staff');
        setIsPinned(false);
        setRequiresAcknowledgement(false);
        setSelectedRoles(new Set());
        setSelectedGroups(new Set());
        router.refresh();
      } else {
        setError(res.error ? t(res.error) : t('admin.announcements.errorCreateFailed'));
      }
    });
  };

  return (
    <section className="rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <Megaphone className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-ink dark:text-surface">
          {t('admin.announcements.createTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
            {t('admin.announcements.titleLabel')}
          </span>
          <input
            type="text"
            required
            disabled={isPending}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.announcements.titlePlaceholder')}
            className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        {/* Body */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
            {t('admin.announcements.bodyLabel')}
          </span>
          <textarea
            required
            rows={4}
            disabled={isPending}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('admin.announcements.bodyPlaceholder')}
            className="w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent resize-y"
          />
        </label>

        {/* Target Type & Settings Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Target Type */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
              {t('admin.announcements.targetTypeLabel')}
            </span>
            <select
              disabled={isPending}
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as 'all_staff' | 'roles' | 'groups')}
              className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent"
            >
              <option value="all_staff">{t('admin.announcements.targetAll')}</option>
              <option value="roles">{t('admin.announcements.targetRoles')}</option>
              <option value="groups">{t('admin.announcements.targetGroups')}</option>
            </select>
          </label>

          {/* Config switches (Pinned & Acknowledgement) */}
          <div className="flex flex-col gap-2 justify-end pb-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary dark:text-line cursor-pointer">
              <input
                type="checkbox"
                disabled={isPending}
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              {t('admin.announcements.isPinnedLabel')}
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary dark:text-line cursor-pointer">
              <input
                type="checkbox"
                disabled={isPending}
                checked={requiresAcknowledgement}
                onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              {t('admin.announcements.requiresAcknowledgementLabel')}
            </label>
          </div>
        </div>

        {/* Roles Checkboxes */}
        {targetType === 'roles' ? (
          <div className="rounded-xl border border-surface-sunken dark:border-ink-secondary bg-surface dark:bg-ink/50 p-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted">
              {t('admin.announcements.selectRolesTitle')}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES_LIST.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded-lg border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 py-2 text-xs font-medium text-ink-secondary dark:text-line cursor-pointer"
                >
                  <input
                    type="checkbox"
                    disabled={isPending}
                    checked={selectedRoles.has(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="h-3.5 w-3.5 rounded border-line text-accent focus:ring-accent"
                  />
                  <span>{t(`admin.accessGrants.roles.${role}`)}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* Groups Checkboxes */}
        {targetType === 'groups' ? (
          <div className="rounded-xl border border-surface-sunken dark:border-ink-secondary bg-surface dark:bg-ink/50 p-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted">
              {t('admin.announcements.selectGroupsTitle')}
            </span>
            {groups.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 rounded-lg border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 py-2 text-xs font-medium text-ink-secondary dark:text-line cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      disabled={isPending}
                      checked={selectedGroups.has(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                      className="h-3.5 w-3.5 rounded border-line text-accent focus:ring-accent"
                    />
                    <span className="truncate">{group.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted dark:text-ink-secondary">
                {t('admin.announcements.noGroupsAvailable')}
              </p>
            )}
          </div>
        ) : null}

        {/* Validation Feedback */}
        {error ? (
          <p className="text-xs font-semibold text-status-critical" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="text-xs font-semibold text-status-positive" role="status">
            {success}
          </p>
        ) : null}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong px-5 text-sm font-bold text-white transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{t('admin.announcements.createButton')}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
