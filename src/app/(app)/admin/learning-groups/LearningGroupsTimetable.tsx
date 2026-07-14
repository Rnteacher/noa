'use client';

import { Clock, MapPin, User, Pencil, CalendarDays } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { LEARNING_GROUP_WEEKDAYS, type AdminLearningGroup } from '@/features/learning-groups/types';
import { ArchiveLearningGroupButton } from './ArchiveLearningGroupButton';

type LearningGroupsTimetableProps = {
  learningGroups: AdminLearningGroup[];
  weekdayFilter: string;
  onEditGroup: (group: AdminLearningGroup) => void;
  onRescheduleGroup: (group: AdminLearningGroup) => void;
};

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

export function LearningGroupsTimetable({
  learningGroups,
  weekdayFilter,
  onEditGroup,
  onRescheduleGroup,
}: LearningGroupsTimetableProps) {
  const activeWeekdays =
    weekdayFilter === 'all'
      ? LEARNING_GROUP_WEEKDAYS
      : [weekdayFilter as typeof LEARNING_GROUP_WEEKDAYS[number]];

  const colsClass =
    activeWeekdays.length === 1
      ? 'grid-cols-1'
      : activeWeekdays.length <= 5
        ? 'grid-cols-1 md:grid-cols-5 gap-4'
        : 'grid-cols-1 md:grid-cols-5 xl:grid-cols-7 gap-4';

  return (
    <div className={cn('grid gap-4 items-start', colsClass)}>
      {activeWeekdays.map((day) => {
        const dayGroups = learningGroups.filter((g) => g.weekday === day);

        return (
          <div
            key={day}
            className="rounded-xl border border-line dark:border-ink-secondary bg-surface/40 dark:bg-ink/30 p-3 min-w-0"
          >
            <h3 className="text-xs font-bold text-ink-muted dark:text-ink-muted mb-3 border-b border-line/20 dark:border-ink-secondary/40 pb-2">
              {t(`admin.learningGroups.weekday_${day}`)}
              <span className="ml-1.5 text-[10px] text-ink-muted font-medium">
                ({dayGroups.length})
              </span>
            </h3>

            <div className="space-y-3">
              {dayGroups.length > 0 ? (
                dayGroups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      'group relative rounded-lg border bg-white dark:bg-ink p-3 shadow-xs transition-opacity',
                      group.isActive
                        ? 'border-line dark:border-ink-secondary'
                        : 'border-line dark:border-ink-secondary opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-ink dark:text-surface-sunken leading-tight line-clamp-2">
                        {group.title}
                      </h4>
                      {!group.isActive && (
                        <span className="shrink-0 rounded-md bg-surface-sunken dark:bg-ink-secondary px-1 py-0.5 text-[8px] font-bold text-ink-muted">
                          {t('admin.learningGroups.stateInactive')}
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-[10px] text-ink-muted dark:text-ink-muted mb-2 line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    <div className="space-y-1 mb-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-ink-muted dark:text-ink-muted font-mono">
                        <Clock className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                        <span>
                          {formatTime(group.startsAt)} - {formatTime(group.endsAt)}
                        </span>
                      </div>

                      {group.room && (
                        <div className="flex items-center gap-1 text-[10px] text-ink-muted dark:text-ink-muted">
                          <MapPin className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                          <span className="truncate">{group.room}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-ink-muted dark:text-ink-muted">
                        <User className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                        <span className="truncate">
                          {group.leaderName ?? t('admin.learningGroups.noLeader')}
                        </span>
                      </div>
                    </div>

                    {group.targetGroupNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {group.targetGroupNames.map((name, i) => (
                          <span
                            key={i}
                            className="inline-block rounded-md bg-surface dark:bg-ink border border-line/60 dark:border-ink-secondary px-1.5 py-0.5 text-[8px] font-semibold text-ink-secondary dark:text-ink-muted"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-surface-sunken dark:border-ink opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onRescheduleGroup(group)}
                        title={t('admin.learningGroups.rescheduleButton')}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:text-accent hover:bg-surface dark:hover:bg-ink transition-colors"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditGroup(group)}
                        title={t('admin.learningGroups.editButton')}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:text-accent hover:bg-surface dark:hover:bg-ink transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <ArchiveLearningGroupButton
                        learningGroupId={group.id}
                        title={group.title}
                        isActive={group.isActive}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[10px] text-ink-muted border border-dashed border-line dark:border-ink-secondary/80 rounded-lg">
                  -
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
