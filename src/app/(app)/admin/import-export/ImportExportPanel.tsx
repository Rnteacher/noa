'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { importCalendarEvents, type ImportedEventItem } from '@/features/calendar/admin-actions';
import { previewGoogleCalendarSyncAction, runGoogleCalendarSyncAction, type SyncPreviewResult, type SyncRunResult } from '@/features/calendar/google-sync-actions';
import { t } from '@/lib/i18n';

type StudentGroup = {
  id: string;
  name: string;
};

type SchoolYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type ImportExportPanelProps = {
  groups: StudentGroup[];
  isSyncConfigured: boolean;
  schoolYears: SchoolYear[];
};

type RowPreview = {
  rowNum: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: 'all_school' | 'groups' | 'staff_only' | 'leadership_only';
  location: string | null;
  targetGroupNames: string[];
  groupIds: string[];
  errors: string[];
};

function parseCsv(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        row.push(cell);
        cell = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          result.push(row);
        }
        row = [];
        if (c === '\r' && next === '\n') {
          i++; // Skip LF after CR
        }
      } else {
        cell += c;
      }
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      result.push(row);
    }
  }

  return result;
}

export function ImportExportPanel({ groups, isSyncConfigured, schoolYears }: ImportExportPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [previewRows, setPreviewRows] = useState<RowPreview[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state variables
  const currentYearId = schoolYears.find((y) => y.isCurrent)?.id || schoolYears[0]?.id || '';
  const [selectedYearId, setSelectedYearId] = useState<string>(currentYearId);
  const [isSyncPending, startSyncTransition] = useTransition();
  const [syncPreview, setSyncPreview] = useState<SyncPreviewResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncRunResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  function handleSyncPreview() {
    setSyncError(null);
    setSyncResult(null);
    setSyncPreview(null);

    startSyncTransition(async () => {
      const res = await previewGoogleCalendarSyncAction(selectedYearId);
      if (!res.success) {
        setSyncError(res.error || 'Failed to fetch sync preview.');
      } else {
        setSyncPreview(res);
      }
    });
  }

  function handleSyncRun() {
    setSyncError(null);
    setSyncResult(null);
    setSyncPreview(null);

    startSyncTransition(async () => {
      const res = await runGoogleCalendarSyncAction(selectedYearId);
      if (!res.success) {
        setSyncError(res.error || 'Sync execution failed.');
      } else {
        setSyncResult(res);
        router.refresh();
      }
    });
  }

  const groupNameToIdMap = new Map(groups.map((g) => [g.name.toLowerCase().trim(), g.id]));
  const groupIdsSet = new Set(groups.map((g) => g.id));

  // Template / Example Download URLs
  const templateCsv = 'title,description,starts_at,ends_at,is_all_day,visibility,location,target_group_names,target_group_ids';
  const templateUri = `data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`;

  const exampleCsv = `title,description,starts_at,ends_at,is_all_day,visibility,location,target_group_names,target_group_ids
Staff Preparations Seminar,Annual curriculum prep week,2026-09-01T08:00:00Z,2026-09-01T16:00:00Z,false,staff_only,Conference Room,,
Opening Ceremony,Opening ceremony for all students and parents,2026-09-07T08:00:00Z,2026-09-07T12:00:00Z,false,all_school,Main Hall,,
Robotics Club Kickoff,Initial registration and safety orientation,2026-09-10T14:00:00Z,2026-09-10T16:00:00Z,false,groups,Lab 1,Robotics Team,
Autumn Break,School closed for holidays,2026-10-14,2026-10-23,true,all_school,School-wide,,`;
  const exampleUri = `data:text/csv;charset=utf-8,${encodeURIComponent(exampleCsv)}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setGlobalError(null);
    setSuccessMsg(null);
    setPreviewRows([]);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setGlobalError('File is empty.');
        return;
      }

      try {
        const rows = parseCsv(text);
        if (rows.length < 2) {
          setGlobalError('CSV must contain a header row and at least one event row.');
          return;
        }

        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const colIndex = (name: string) => headers.indexOf(name.toLowerCase());

        const idxTitle = colIndex('title');
        const idxDescription = colIndex('description');
        const idxStartsAt = colIndex('starts_at');
        const idxEndsAt = colIndex('ends_at');
        const idxIsAllDay = colIndex('is_all_day');
        const idxVisibility = colIndex('visibility');
        const idxLocation = colIndex('location');
        const idxGroupNames = colIndex('target_group_names');
        const idxGroupIds = colIndex('target_group_ids');

        if (idxTitle === -1 || idxStartsAt === -1 || idxEndsAt === -1 || idxVisibility === -1) {
          setGlobalError('CSV is missing required headers: title, starts_at, ends_at, visibility.');
          return;
        }

        const parsedPreviews: RowPreview[] = [];
        const seenEvents = new Set<string>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Skip empty trailing rows
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const rowNum = i + 1;
          const errors: string[] = [];

          const title = (row[idxTitle] ?? '').trim();
          const description = idxDescription !== -1 ? (row[idxDescription] ?? '').trim() : '';
          const startsAtRaw = (row[idxStartsAt] ?? '').trim();
          const endsAtRaw = (row[idxEndsAt] ?? '').trim();
          const isAllDayRaw = idxIsAllDay !== -1 ? (row[idxIsAllDay] ?? '').trim().toLowerCase() : 'false';
          const visibilityRaw = (row[idxVisibility] ?? '').trim().toLowerCase();
          const location = idxLocation !== -1 ? (row[idxLocation] ?? '').trim() : '';

          const groupNamesRaw = idxGroupNames !== -1 ? (row[idxGroupNames] ?? '').trim() : '';
          const groupIdsRaw = idxGroupIds !== -1 ? (row[idxGroupIds] ?? '').trim() : '';

          // 1. Title check
          if (!title) {
            errors.push('Title is required.');
          }

          // 2. Dates check
          const startsAtDate = new Date(startsAtRaw);
          const endsAtDate = new Date(endsAtRaw);
          if (Number.isNaN(startsAtDate.getTime())) {
            errors.push(`Invalid start date format: "${startsAtRaw}".`);
          }
          if (Number.isNaN(endsAtDate.getTime())) {
            errors.push(`Invalid end date format: "${endsAtRaw}".`);
          }
          if (!Number.isNaN(startsAtDate.getTime()) && !Number.isNaN(endsAtDate.getTime())) {
            if (endsAtDate <= startsAtDate) {
              errors.push('End date must be strictly after start date.');
            }
          }

          // 3. Visibility check
          const validVisibilities = ['all_school', 'groups', 'staff_only', 'leadership_only'];
          if (!validVisibilities.includes(visibilityRaw)) {
            errors.push(`Invalid visibility: "${visibilityRaw}". Allowed values: ${validVisibilities.join(', ')}.`);
          }

          // 4. Group resolution checks
          const targetGroupNames: string[] = [];
          const targetGroupIds: string[] = [];

          if (visibilityRaw === 'groups') {
            const names = groupNamesRaw ? groupNamesRaw.split(';').map((n) => n.trim()).filter(Boolean) : [];
            const ids = groupIdsRaw ? groupIdsRaw.split(';').map((id) => id.trim()).filter(Boolean) : [];

            if (names.length === 0 && ids.length === 0) {
              errors.push('Target groups are required when visibility is "groups".');
            }

            // Resolve names to IDs
            for (const name of names) {
              const matchedId = groupNameToIdMap.get(name.toLowerCase());
              if (matchedId) {
                targetGroupNames.push(name);
                targetGroupIds.push(matchedId);
              } else {
                errors.push(`Target group name "${name}" could not be resolved.`);
              }
            }

            // Verify explicit IDs
            for (const id of ids) {
              if (groupIdsSet.has(id)) {
                targetGroupIds.push(id);
                const name = groups.find((g) => g.id === id)?.name || id;
                if (!targetGroupNames.includes(name)) {
                  targetGroupNames.push(name);
                }
              } else {
                errors.push(`Target group ID "${id}" is invalid or inactive.`);
              }
            }
          }

          // 5. Duplicate checks within file
          const dupKey = `${title}|${startsAtRaw}|${endsAtRaw}`;
          if (seenEvents.has(dupKey)) {
            errors.push('Duplicate row within CSV file (same title, starts_at, and ends_at).');
          } else {
            seenEvents.add(dupKey);
          }

          parsedPreviews.push({
            rowNum,
            title,
            description: description || null,
            startsAt: startsAtRaw,
            endsAt: endsAtRaw,
            isAllDay: isAllDayRaw === 'true',
            visibility: visibilityRaw as 'all_school' | 'groups' | 'staff_only' | 'leadership_only',
            location: location || null,
            targetGroupNames,
            groupIds: Array.from(new Set(targetGroupIds)),
            errors,
          });
        }

        setPreviewRows(parsedPreviews);
      } catch (err) {
        console.error(err);
        setGlobalError('Failed to parse CSV file. Ensure it is RFC-4180 double-quoted format.');
      }
    };
    reader.readAsText(file);
  }

  function handleImportApply() {
    setGlobalError(null);
    setSuccessMsg(null);

    const hasErrors = previewRows.some((r) => r.errors.length > 0);
    if (hasErrors) {
      setGlobalError('Cannot import. Please resolve the validation errors listed below.');
      return;
    }

    const items: ImportedEventItem[] = previewRows.map((r) => ({
      title: r.title,
      description: r.description,
      startsAt: new Date(r.startsAt).toISOString(),
      endsAt: new Date(r.endsAt).toISOString(),
      isAllDay: r.isAllDay,
      visibility: r.visibility,
      location: r.location,
      groupIds: r.groupIds,
    }));

    startTransition(async () => {
      const res = await importCalendarEvents(items);
      if (!res.success) {
        setGlobalError(res.error ? t(res.error) : 'Failed to import calendar events.');
        return;
      }

      setSuccessMsg(`Successfully imported ${items.length} new calendar events!`);
      setPreviewRows([]);
      router.refresh();
    });
  }

  const errorCount = previewRows.reduce((sum, r) => sum + r.errors.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      <div className="space-y-6">
        {/* Templates & Export Panel */}
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            CSV Templates & Export
          </h2>
          <p className="text-xs text-zinc-500 leading-normal">
            Download templates or export current calendar events to update school planning.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={templateUri}
              download="calendar_events_template.csv"
              className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <span>Empty CSV Template</span>
              <Download className="h-4 w-4 text-zinc-500" />
            </a>

            <a
              href={exampleUri}
              download="calendar_events_example.csv"
              className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <span>Mock Example CSV</span>
              <Download className="h-4 w-4 text-zinc-500" />
            </a>

            <a
              href="/api/admin/calendar/export"
              className="flex items-center justify-between rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 px-4 py-2.5 text-xs font-bold text-white dark:text-zinc-950 transition-colors mt-2"
            >
              <span>Export Roster to CSV</span>
              <Download className="h-4 w-4 text-white dark:text-zinc-950" />
            </a>
          </div>
        </section>

        {/* Google Calendar Sync Panel */}
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600" />
            Google Calendar Outbound Mirror
          </h2>
          <p className="text-xs text-zinc-500 leading-normal">
            Mirror local staff app events to a single Google Calendar. The app remains the source of truth; updates are outbound only.
          </p>

          {!isSyncConfigured ? (
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 text-xs text-zinc-550 dark:text-zinc-400 font-medium leading-normal border border-zinc-100 dark:border-zinc-800">
              Google Calendar Sync is not configured. Enable via server environment variables to begin.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <label htmlFor="sync-year-select" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  School Year
                </label>
                <select
                  id="sync-year-select"
                  value={selectedYearId}
                  onChange={(e) => {
                    setSelectedYearId(e.target.value);
                    setSyncPreview(null);
                    setSyncResult(null);
                    setSyncError(null);
                  }}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                >
                  {schoolYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSyncPreview}
                  disabled={isSyncPending || !selectedYearId}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Preview Sync
                </button>
                <button
                  type="button"
                  onClick={handleSyncRun}
                  disabled={isSyncPending || !selectedYearId}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSyncPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Run Sync
                </button>
              </div>

              {/* Sync Error */}
              {syncError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-350 font-medium leading-normal flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}

              {/* Preview Results */}
              {syncPreview && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2 text-xs">
                  <div className="font-bold text-zinc-850 dark:text-zinc-200">Outbound Changes Preview:</div>
                  <ul className="space-y-1.5 text-zinc-650 dark:text-zinc-400">
                    <li className="flex justify-between">
                      <span>Will Create in Google:</span>
                      <span className="font-bold text-emerald-650 dark:text-emerald-450">{syncPreview.insertedCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Will Update in Google:</span>
                      <span className="font-bold text-amber-650 dark:text-amber-455">{syncPreview.updatedCount}</span>
                    </li>
                    {syncPreview.skippedCount > 0 && (
                      <li className="flex justify-between text-rose-600 dark:text-rose-455">
                        <span>Skipped (invalid):</span>
                        <span className="font-bold">{syncPreview.skippedCount}</span>
                      </li>
                    )}
                  </ul>
                  {syncPreview.warnings.length > 0 && (
                    <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 text-[10px] space-y-1 text-amber-700 dark:text-amber-450 font-medium">
                      <div className="font-bold">Warnings:</div>
                      {syncPreview.warnings.slice(0, 3).map((w, idx) => (
                        <div key={idx}>&bull; {w}</div>
                      ))}
                      {syncPreview.warnings.length > 3 && (
                        <div>&bull; And {syncPreview.warnings.length - 3} more...</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Run Results */}
              {syncResult && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-emerald-50/20 dark:bg-emerald-950/5 p-3 space-y-2 text-xs">
                  <div className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Sync Run Completed
                  </div>
                  <ul className="space-y-1.5 text-zinc-650 dark:text-zinc-400">
                    <li className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-bold text-emerald-650 dark:text-emerald-450">{syncResult.insertedCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-bold text-amber-650 dark:text-amber-455">{syncResult.updatedCount}</span>
                    </li>
                    {syncResult.failedCount > 0 && (
                      <li className="flex justify-between text-rose-650 dark:text-rose-455">
                        <span>Failed:</span>
                        <span className="font-bold">{syncResult.failedCount}</span>
                      </li>
                    )}
                  </ul>

                  {syncResult.failures.length > 0 && (
                    <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 text-[10px] space-y-1 text-rose-700 dark:text-rose-450 font-medium">
                      <div className="font-bold">Errors:</div>
                      {syncResult.failures.slice(0, 2).map((f, idx) => (
                        <div key={idx}>&bull; {f.title}: {f.reason}</div>
                      ))}
                      {syncResult.failures.length > 2 && (
                        <div>&bull; And {syncResult.failures.length - 2} more...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* CSV Import Ingestion Panel */}
      <section className="lg:col-span-2 space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-600" />
          Ingest Calendar CSV
        </h2>
        <p className="text-xs text-zinc-500 leading-normal">
          Upload a calendar event roster. The validator checks for format issues, date order, and target group existence before applying changes.
        </p>

        {/* Upload input */}
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors">
          <input
            type="file"
            accept=".csv"
            id="csv-upload-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="csv-upload-input"
            className="cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Upload className="h-8 w-8 text-zinc-400" />
            <span>Click to select CSV file</span>
          </label>
        </div>

        {/* Feedback Banners */}
        {globalError && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-normal">
              {globalError}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-450 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 dark:text-emerald-350 font-medium leading-normal">
              {successMsg}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {previewRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Preview ({previewRows.length} events)
              </span>
              <button
                type="button"
                onClick={handleImportApply}
                disabled={errorCount > 0 || isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white flex items-center gap-2 transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Apply Import
                  </>
                )}
              </button>
            </div>

            {errorCount > 0 && (
              <p className="text-[10px] font-bold text-rose-650 dark:text-rose-450">
                {errorCount} errors detected. Please fix the CSV file and upload again.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-850">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold select-none">
                    <th className="py-2.5 px-3 text-start w-12">Row</th>
                    <th className="py-2.5 px-2 text-start w-16">Status</th>
                    <th className="py-2.5 px-2 text-start">Title</th>
                    <th className="py-2.5 px-2 text-start">Starts At</th>
                    <th className="py-2.5 px-2 text-start">Ends At</th>
                    <th className="py-2.5 px-2 text-start">Visibility</th>
                    <th className="py-2.5 px-2 text-start">Groups</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {previewRows.map((row) => {
                    const hasRowErrors = row.errors.length > 0;
                    return (
                      <tr
                        key={row.rowNum}
                        className={
                          hasRowErrors
                            ? 'bg-rose-50/20 dark:bg-rose-950/5'
                            : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-850/10'
                        }
                      >
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">{row.rowNum}</td>
                        <td className="py-2.5 px-2">
                          {hasRowErrors ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 text-[10px] font-bold">
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 text-[10px] font-bold">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{row.title}</div>
                          {hasRowErrors && (
                            <div className="mt-1 space-y-0.5">
                              {row.errors.map((err, errIdx) => (
                                <div key={errIdx} className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                  &bull; {err}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                          {row.startsAt}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                          {row.endsAt}
                        </td>
                        <td className="py-2.5 px-2 text-zinc-600 dark:text-zinc-400">
                          <span className="capitalize">{row.visibility.replace('_', ' ')}</span>
                        </td>
                        <td className="py-2.5 px-2 text-zinc-650 dark:text-zinc-400 truncate max-w-[120px]">
                          {row.targetGroupNames.length > 0 ? row.targetGroupNames.join(', ') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
