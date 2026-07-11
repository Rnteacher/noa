'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '@/lib/i18n';

type CalendarDateNavigatorProps = {
  view: string;
  currentDateStr: string;
};

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function CalendarDateNavigator({ view, currentDateStr }: CalendarDateNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = parseLocalDate(currentDateStr);

  function navigateToDate(nextDate: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', formatDateStr(nextDate));
    router.push(`/admin/calendar?${params.toString()}`);
  }

  function handlePrev() {
    const prevDate = new Date(date);
    if (view === 'day') {
      prevDate.setDate(date.getDate() - 1);
    } else if (view === 'week') {
      prevDate.setDate(date.getDate() - 7);
    } else if (view === 'month') {
      prevDate.setMonth(date.getMonth() - 1);
    } else if (view === 'year') {
      prevDate.setFullYear(date.getFullYear() - 1);
    } else {
      prevDate.setDate(date.getDate() - 7);
    }
    navigateToDate(prevDate);
  }

  function handleNext() {
    const nextDate = new Date(date);
    if (view === 'day') {
      nextDate.setDate(date.getDate() + 1);
    } else if (view === 'week') {
      nextDate.setDate(date.getDate() + 7);
    } else if (view === 'month') {
      nextDate.setMonth(date.getMonth() + 1);
    } else if (view === 'year') {
      nextDate.setFullYear(date.getFullYear() + 1);
    } else {
      nextDate.setDate(date.getDate() + 7);
    }
    navigateToDate(nextDate);
  }

  function handleToday() {
    navigateToDate(new Date());
  }

  let labelStr = '';
  if (view === 'day') {
    labelStr = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(date);
  } else if (view === 'week') {
    const sunday = new Date(date);
    const dayOffset = sunday.getDay();
    sunday.setDate(sunday.getDate() - dayOffset);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);

    const fmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' });
    const fmtYear = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
    
    labelStr = `${fmt.format(sunday)} - ${fmtYear.format(saturday)}`;
  } else if (view === 'month') {
    labelStr = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
  } else if (view === 'year') {
    const yr = date.getFullYear();
    const isSeptOrLater = date.getMonth() >= 8;
    labelStr = isSeptOrLater ? `${yr} - ${yr + 1}` : `${yr - 1} - ${yr}`;
  } else {
    labelStr = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(date);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-sm">
        <button
          type="button"
          onClick={handlePrev}
          title={t('admin.calendar.prev')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rtl:hidden" />
          <ChevronLeft className="h-4 w-4 ltr:hidden" />
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="px-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors border-x border-zinc-100 dark:border-zinc-800"
        >
          {t('admin.calendar.today')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          title={t('admin.calendar.next')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rtl:hidden" />
          <ChevronRight className="h-4 w-4 ltr:hidden" />
        </button>
      </div>
      <span dir="ltr" className="text-sm font-bold text-zinc-800 dark:text-zinc-200 px-1 select-none">
        {labelStr}
      </span>
    </div>
  );
}
