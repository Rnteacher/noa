'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  Lock,
  HelpCircle,
  Clock,
  Terminal,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { importCalendarEvents, type ImportedEventItem } from '@/features/calendar/admin-actions';
import { importLearningGroups, type ImportedLearningGroupItem } from '@/features/learning-groups/admin-actions';
import { validateRosterAction, type ValidationReport } from '@/features/import-export/roster-actions';
import { parseCsv } from '@/features/import-export/csv';
import {
  previewGoogleCalendarSyncAction,
  runGoogleCalendarSyncAction,
  type SyncPreviewResult,
  type SyncRunResult
} from '@/features/calendar/google-sync-actions';
import { t } from '@/lib/i18n';

type StudentGroup = {
  id: string;
  name: string;
};

type ActiveProfile = {
  id: string;
  full_name: string;
  email: string;
};

type SchoolYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type ImportExportPanelProps = {
  groups: StudentGroup[];
  profiles: ActiveProfile[];
  isSyncConfigured: boolean;
  schoolYears: SchoolYear[];
};

type CalendarEventRowPreview = {
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

type LearningGroupRowPreview = {
  rowNum: number;
  title: string;
  description: string | null;
  weekday: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
  leaderEmail: string;
  leaderId: string | null;
  targetGroupNames: string[];
  groupIds: string[];
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
  errors: string[];
};

export function ImportExportPanel({ groups, profiles, isSyncConfigured, schoolYears }: ImportExportPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'calendar' | 'learningGroups' | 'staff' | 'students' | 'operatorNotes'>('calendar');
  const [isPending, startTransition] = useTransition();

  // Calendar States
  const [calPreviewRows, setCalPreviewRows] = useState<CalendarEventRowPreview[]>([]);
  const [calGlobalError, setCalGlobalError] = useState<string | null>(null);
  const [calSuccessMsg, setCalSuccessMsg] = useState<string | null>(null);

  // Calendar Google Sync states
  const currentYearId = schoolYears.find((y) => y.isCurrent)?.id || schoolYears[0]?.id || '';
  const [selectedYearId, setSelectedYearId] = useState<string>(currentYearId);
  const [isSyncPending, startSyncTransition] = useTransition();
  const [syncPreview, setSyncPreview] = useState<SyncPreviewResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncRunResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Learning Group States
  const [lgPreviewRows, setLgPreviewRows] = useState<LearningGroupRowPreview[]>([]);
  const [lgGlobalError, setLgGlobalError] = useState<string | null>(null);
  const [lgSuccessMsg, setLgSuccessMsg] = useState<string | null>(null);

  // Roster States (Staff & Students)
  const [rosterFiles, setRosterFiles] = useState<Record<string, string>>({});
  const [rosterReport, setRosterReport] = useState<ValidationReport | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterValidating, setRosterValidating] = useState(false);

  // Maps for resolution
  const groupNameToIdMap = new Map(groups.map((g) => [g.name.toLowerCase().trim(), g.id]));
  const groupIdsSet = new Set(groups.map((g) => g.id));
  const profileEmailToIdMap = new Map(profiles.map((p) => [p.email.toLowerCase().trim(), p.id]));

  // Calendar CSV URIs
  const calTemplateCsv = 'title,description,starts_at,ends_at,is_all_day,visibility,location,target_group_names,target_group_ids';
  const calTemplateUri = `data:text/csv;charset=utf-8,${encodeURIComponent(calTemplateCsv)}`;

  const calExampleCsv = `title,description,starts_at,ends_at,is_all_day,visibility,location,target_group_names,target_group_ids
Staff Preparations Seminar,Annual curriculum prep week,2026-09-01T08:00:00Z,2026-09-01T16:00:00Z,false,staff_only,Conference Room,,
Opening Ceremony,Opening ceremony for all students and parents,2026-09-07T08:00:00Z,2026-09-07T12:00:00Z,false,all_school,Main Hall,,
Robotics Club Kickoff,Initial registration and safety orientation,2026-09-10T14:00:00Z,2026-09-10T16:00:00Z,false,groups,Lab 1,Robotics Team,
Autumn Break,School closed for holidays,2026-10-14,2026-10-23,true,all_school,School-wide,,`;
  const calExampleUri = `data:text/csv;charset=utf-8,${encodeURIComponent(calExampleCsv)}`;

  // Learning Group CSV URIs
  const lgTemplateCsv = 'title,description,weekday,starts_at,ends_at,room,leader_email,target_group_names,target_group_ids,active_from,active_until,is_active';
  const lgTemplateUri = `data:text/csv;charset=utf-8,${encodeURIComponent(lgTemplateCsv)}`;

  const lgExampleCsv = `title,description,weekday,starts_at,ends_at,room,leader_email,target_group_names,target_group_ids,active_from,active_until,is_active
Software Development Lab,Hands-on TypeScript and Next.js full-stack development,monday,11:30,13:30,Lab 2,mentor.one@example.test,Robotics Team,,2026-09-01,,true
Interactive Art Seminar,Visual arts and design principles workshop,wednesday,11:30,13:00,Room 102,mentor.two@example.test,Art Studio,,2026-09-01,,true
Robot Safety Club,Initial safety training and parts inventory,thursday,12:00,13:30,Lab 1,master.one@example.test,Robotics Team,,2026-09-01,2026-12-31,true`;
  const lgExampleUri = `data:text/csv;charset=utf-8,${encodeURIComponent(lgExampleCsv)}`;

  // Roster CSV Templates / Examples download helpers
  function downloadMockFile(filename: string, content: string) {
    const uri = `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
    const link = document.createElement('a');
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Google Calendar sync preview
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

  // Handle Google Calendar sync execute
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

  // Handle Calendar CSV parse
  function handleCalendarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCalGlobalError(null);
    setCalSuccessMsg(null);
    setCalPreviewRows([]);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCalGlobalError('File is empty.');
        return;
      }

      try {
        const rows = parseCsv(text);
        if (rows.length < 2) {
          setCalGlobalError('CSV must contain a header row and at least one event row.');
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
          setCalGlobalError('CSV is missing required headers: title, starts_at, ends_at, visibility.');
          return;
        }

        const parsedPreviews: CalendarEventRowPreview[] = [];
        const seenEvents = new Set<string>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
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

          if (!title) errors.push('Title is required.');

          const startsAtDate = new Date(startsAtRaw);
          const endsAtDate = new Date(endsAtRaw);
          if (Number.isNaN(startsAtDate.getTime())) errors.push(`Invalid start date: "${startsAtRaw}".`);
          if (Number.isNaN(endsAtDate.getTime())) errors.push(`Invalid end date: "${endsAtRaw}".`);
          if (!Number.isNaN(startsAtDate.getTime()) && !Number.isNaN(endsAtDate.getTime()) && endsAtDate <= startsAtDate) {
            errors.push('End date must be strictly after start date.');
          }

          const validVisibilities = ['all_school', 'groups', 'staff_only', 'leadership_only'];
          if (!validVisibilities.includes(visibilityRaw)) {
            errors.push(`Invalid visibility: "${visibilityRaw}". Allowed: ${validVisibilities.join(', ')}.`);
          }

          const targetGroupNames: string[] = [];
          const targetGroupIds: string[] = [];

          if (visibilityRaw === 'groups') {
            const names = groupNamesRaw ? groupNamesRaw.split(';').map((n) => n.trim()).filter(Boolean) : [];
            const ids = groupIdsRaw ? groupIdsRaw.split(';').map((id) => id.trim()).filter(Boolean) : [];

            if (names.length === 0 && ids.length === 0) {
              errors.push('Target groups are required when visibility is "groups".');
            }

            for (const name of names) {
              const matchedId = groupNameToIdMap.get(name.toLowerCase());
              if (matchedId) {
                targetGroupNames.push(name);
                targetGroupIds.push(matchedId);
              } else {
                errors.push(`Target group name "${name}" could not be resolved.`);
              }
            }

            for (const id of ids) {
              if (groupIdsSet.has(id)) {
                targetGroupIds.push(id);
                const name = groups.find((g) => g.id === id)?.name || id;
                if (!targetGroupNames.includes(name)) targetGroupNames.push(name);
              } else {
                errors.push(`Target group ID "${id}" is invalid.`);
              }
            }
          }

          const dupKey = `${title}|${startsAtRaw}|${endsAtRaw}`;
          if (seenEvents.has(dupKey)) {
            errors.push('Duplicate row (same title, starts_at, and ends_at).');
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
            visibility: visibilityRaw as CalendarEventRowPreview['visibility'],
            location: location || null,
            targetGroupNames,
            groupIds: Array.from(new Set(targetGroupIds)),
            errors,
          });
        }

        setCalPreviewRows(parsedPreviews);
      } catch (err) {
        console.error(err);
        setCalGlobalError('Failed to parse CSV file. Ensure it is in RFC-4180 format.');
      }
    };
    reader.readAsText(file);
  }

  // Handle Calendar Ingest Apply
  function handleCalendarImportApply() {
    setCalGlobalError(null);
    setCalSuccessMsg(null);

    const hasErrors = calPreviewRows.some((r) => r.errors.length > 0);
    if (hasErrors) {
      setCalGlobalError('Cannot import. Please resolve the validation errors.');
      return;
    }

    const items: ImportedEventItem[] = calPreviewRows.map((r) => ({
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
        setCalGlobalError(res.error ? t(res.error) : 'Failed to import calendar events.');
        return;
      }

      setCalSuccessMsg(`Successfully imported ${items.length} new calendar events!`);
      setCalPreviewRows([]);
      router.refresh();
    });
  }

  // Handle Learning Groups CSV parse
  function handleLearningGroupsFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLgGlobalError(null);
    setLgSuccessMsg(null);
    setLgPreviewRows([]);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setLgGlobalError('File is empty.');
        return;
      }

      try {
        const rows = parseCsv(text);
        if (rows.length < 2) {
          setLgGlobalError('CSV must contain a header row and at least one learning group row.');
          return;
        }

        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const colIndex = (name: string) => headers.indexOf(name.toLowerCase());

        const idxTitle = colIndex('title');
        const idxDescription = colIndex('description');
        const idxWeekday = colIndex('weekday');
        const idxStartsAt = colIndex('starts_at');
        const idxEndsAt = colIndex('ends_at');
        const idxRoom = colIndex('room');
        const idxLeaderEmail = colIndex('leader_email');
        const idxGroupNames = colIndex('target_group_names');
        const idxGroupIds = colIndex('target_group_ids');
        const idxActiveFrom = colIndex('active_from');
        const idxActiveUntil = colIndex('active_until');
        const idxIsActive = colIndex('is_active');

        if (idxTitle === -1 || idxWeekday === -1 || idxStartsAt === -1 || idxEndsAt === -1) {
          setLgGlobalError('CSV is missing required headers: title, weekday, starts_at, ends_at.');
          return;
        }

        const parsedPreviews: LearningGroupRowPreview[] = [];
        const seenGroups = new Set<string>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const rowNum = i + 1;
          const errors: string[] = [];

          const title = (row[idxTitle] ?? '').trim();
          const description = idxDescription !== -1 ? (row[idxDescription] ?? '').trim() : '';
          const weekdayRaw = (row[idxWeekday] ?? '').trim().toLowerCase();
          const startsAtRaw = (row[idxStartsAt] ?? '').trim();
          const endsAtRaw = (row[idxEndsAt] ?? '').trim();
          const room = idxRoom !== -1 ? (row[idxRoom] ?? '').trim() : '';
          const leaderEmail = idxLeaderEmail !== -1 ? (row[idxLeaderEmail] ?? '').trim().toLowerCase() : '';
          const activeFromRaw = idxActiveFrom !== -1 ? (row[idxActiveFrom] ?? '').trim() : '';
          const activeUntilRaw = idxActiveUntil !== -1 ? (row[idxActiveUntil] ?? '').trim() : '';
          const isActiveRaw = idxIsActive !== -1 ? (row[idxIsActive] ?? '').trim().toLowerCase() : 'true';

          const groupNamesRaw = idxGroupNames !== -1 ? (row[idxGroupNames] ?? '').trim() : '';
          const groupIdsRaw = idxGroupIds !== -1 ? (row[idxGroupIds] ?? '').trim() : '';

          if (!title) errors.push('Title is required.');

          const validWeekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          if (!validWeekdays.includes(weekdayRaw)) {
            errors.push(`Invalid weekday: "${weekdayRaw}". Allowed: ${validWeekdays.join(', ')}.`);
          }

          if (startsAtRaw >= endsAtRaw) {
            errors.push('End time must be strictly after start time.');
          }

          if (startsAtRaw < '11:30' || endsAtRaw > '13:30') {
            errors.push('Learning groups must be scheduled inside the standard 11:30 - 13:30 window.');
          }

          let leaderId: string | null = null;
          if (leaderEmail) {
            const matchedProfileId = profileEmailToIdMap.get(leaderEmail);
            if (matchedProfileId) {
              leaderId = matchedProfileId;
            } else {
              errors.push(`Leader email "${leaderEmail}" does not match an active staff profile.`);
            }
          }

          const targetGroupNames: string[] = [];
          const targetGroupIds: string[] = [];

          const names = groupNamesRaw ? groupNamesRaw.split(';').map((n) => n.trim()).filter(Boolean) : [];
          const ids = groupIdsRaw ? groupIdsRaw.split(';').map((id) => id.trim()).filter(Boolean) : [];

          if (names.length === 0 && ids.length === 0) {
            errors.push('At least one target group (by name or ID) is required.');
          }

          for (const name of names) {
            const matchedId = groupNameToIdMap.get(name.toLowerCase());
            if (matchedId) {
              targetGroupNames.push(name);
              targetGroupIds.push(matchedId);
            } else {
              errors.push(`Target group name "${name}" could not be resolved.`);
            }
          }

          for (const id of ids) {
            if (groupIdsSet.has(id)) {
              targetGroupIds.push(id);
              const name = groups.find((g) => g.id === id)?.name || id;
              if (!targetGroupNames.includes(name)) targetGroupNames.push(name);
            } else {
              errors.push(`Target group ID "${id}" is invalid.`);
            }
          }

          const activeFrom = activeFromRaw || '2026-09-01';
          if (!/^\d{4}-\d{2}-\d{2}$/.test(activeFrom)) {
            errors.push(`Invalid active_from date format: "${activeFrom}". Expected YYYY-MM-DD.`);
          }
          if (activeUntilRaw && !/^\d{4}-\d{2}-\d{2}$/.test(activeUntilRaw)) {
            errors.push(`Invalid active_until date format: "${activeUntilRaw}". Expected YYYY-MM-DD.`);
          }

          const dupKey = `${title}|${weekdayRaw}|${startsAtRaw}|${endsAtRaw}`;
          if (seenGroups.has(dupKey)) {
            errors.push('Duplicate row (same title, weekday, and times).');
          } else {
            seenGroups.add(dupKey);
          }

          parsedPreviews.push({
            rowNum,
            title,
            description: description || null,
            weekday: weekdayRaw,
            startsAt: startsAtRaw,
            endsAt: endsAtRaw,
            room: room || null,
            leaderEmail,
            leaderId,
            targetGroupNames,
            groupIds: Array.from(new Set(targetGroupIds)),
            activeFrom,
            activeUntil: activeUntilRaw || null,
            isActive: isActiveRaw === 'true',
            errors,
          });
        }

        setLgPreviewRows(parsedPreviews);
      } catch (err) {
        console.error(err);
        setLgGlobalError('Failed to parse CSV file. Ensure it is in RFC-4180 format.');
      }
    };
    reader.readAsText(file);
  }

  // Handle Learning Groups Apply Ingest
  function handleLearningGroupsImportApply() {
    setLgGlobalError(null);
    setLgSuccessMsg(null);

    const hasErrors = lgPreviewRows.some((r) => r.errors.length > 0);
    if (hasErrors) {
      setLgGlobalError('Cannot import. Please resolve the validation errors.');
      return;
    }

    const items: ImportedLearningGroupItem[] = lgPreviewRows.map((r) => ({
      title: r.title,
      description: r.description,
      weekday: r.weekday as ImportedLearningGroupItem['weekday'],
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      room: r.room,
      leaderId: r.leaderId,
      groupIds: r.groupIds,
      activeFrom: r.activeFrom,
      activeUntil: r.activeUntil,
      isActive: r.isActive,
    }));

    startTransition(async () => {
      const res = await importLearningGroups(items);
      if (!res.success) {
        setLgGlobalError(res.error ? t(res.error) : 'Failed to import learning groups.');
        return;
      }

      setLgSuccessMsg(`Successfully imported ${items.length} weekly learning groups!`);
      setLgPreviewRows([]);
      router.refresh();
    });
  }

  // Handle Multi-file roster uploads (Staff & Students)
  function handleRosterFileSelect(e: React.ChangeEvent<HTMLInputElement>, fileKey: string) {
    setRosterReport(null);
    setRosterError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRosterFiles((prev) => ({
        ...prev,
        [fileKey]: text || '',
      }));
    };
    reader.readAsText(file);
  }

  // Validate Roster files via server action
  async function handleValidateRoster() {
    setRosterReport(null);
    setRosterError(null);
    setRosterValidating(true);

    try {
      const report = await validateRosterAction(rosterFiles);
      setRosterReport(report);
    } catch (err) {
      console.error(err);
      setRosterError('Roster validation failed. Ensure files are correctly formatted CSVs.');
    } finally {
      setRosterValidating(false);
    }
  }

  // Clear loaded files
  function handleClearRosterFiles() {
    setRosterFiles({});
    setRosterReport(null);
    setRosterError(null);
  }

  const calErrorCount = calPreviewRows.reduce((sum, r) => sum + r.errors.length, 0);
  const lgErrorCount = lgPreviewRows.reduce((sum, r) => sum + r.errors.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-line dark:border-ink-secondary scrollbar-none overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'border-accent text-accent-strong dark:text-accent-strong'
              : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-ink-muted'
          }`}
        >
          <Calendar className="h-4 w-4" />
          {t('admin.importExport.tabs.calendar')}
        </button>

        <button
          onClick={() => setActiveTab('learningGroups')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'learningGroups'
              ? 'border-accent text-accent-strong dark:text-accent-strong'
              : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-ink-muted'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          {t('admin.importExport.tabs.learningGroups')}
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'staff'
              ? 'border-accent text-accent-strong dark:text-accent-strong'
              : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-ink-muted'
          }`}
        >
          <Lock className="h-4 w-4" />
          {t('admin.importExport.tabs.staff')}
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-accent text-accent-strong dark:text-accent-strong'
              : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-ink-muted'
          }`}
        >
          <Users className="h-4 w-4" />
          {t('admin.importExport.tabs.students')}
        </button>

        <button
          onClick={() => setActiveTab('operatorNotes')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'operatorNotes'
              ? 'border-accent text-accent-strong dark:text-accent-strong'
              : 'border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-ink-muted'
          }`}
        >
          <Terminal className="h-4 w-4" />
          {t('admin.importExport.tabs.operatorNotes')}
        </button>
      </div>

      {/* Tabs Content */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">

        {/* LEFT COLUMN: Controls & Description */}
        <div className="space-y-6">

          {/* Tab Information */}
          <section className="space-y-4 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-5 shadow-xs">
            <h2 className="text-base font-bold text-ink dark:text-surface flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-accent" />
              {activeTab === 'calendar' && t('admin.importExport.tabs.calendar')}
              {activeTab === 'learningGroups' && t('admin.importExport.tabs.learningGroups')}
              {activeTab === 'staff' && t('admin.importExport.tabs.staff')}
              {activeTab === 'students' && t('admin.importExport.tabs.students')}
              {activeTab === 'operatorNotes' && t('admin.importExport.tabs.operatorNotes')}
            </h2>
            <p className="text-xs text-ink-muted leading-normal">
              {activeTab === 'calendar' && t('admin.importExport.calendar.desc')}
              {activeTab === 'learningGroups' && t('admin.importExport.learningGroups.desc')}
              {activeTab === 'staff' && t('admin.importExport.staff.desc')}
              {activeTab === 'students' && t('admin.importExport.students.desc')}
              {activeTab === 'operatorNotes' && t('admin.importExport.operatorNotes.desc')}
            </p>

            {/* Template/Mock Downloads */}
            {activeTab === 'calendar' && (
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={calTemplateUri}
                  download="calendar_events_template.csv"
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors"
                >
                  <span>Empty CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </a>
                <a
                  href={calExampleUri}
                  download="calendar_events_example.csv"
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors"
                >
                  <span>Mock Example CSV</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </a>
                <a
                  href="/api/admin/calendar/export"
                  className="flex items-center justify-between rounded-xl bg-ink hover:bg-ink dark:bg-surface dark:hover:bg-line px-4 py-2.5 text-xs font-bold text-white dark:text-ink transition-colors mt-2"
                >
                  <span>Export Calendar to CSV</span>
                  <Download className="h-4 w-4 text-white dark:text-ink" />
                </a>
              </div>
            )}

            {activeTab === 'learningGroups' && (
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={lgTemplateUri}
                  download="learning_groups_template.csv"
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors"
                >
                  <span>Empty CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </a>
                <a
                  href={lgExampleUri}
                  download="learning_groups_example.csv"
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors"
                >
                  <span>Mock Example CSV</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </a>
                <a
                  href="/api/admin/learning-groups/export"
                  className="flex items-center justify-between rounded-xl bg-ink hover:bg-ink dark:bg-surface dark:hover:bg-line px-4 py-2.5 text-xs font-bold text-white dark:text-ink transition-colors mt-2"
                >
                  <span>Export Groups to CSV</span>
                  <Download className="h-4 w-4 text-white dark:text-ink" />
                </a>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => downloadMockFile('staff_access_grants_template.csv', 'email,full_name,is_active')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Grants CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
                <button
                  onClick={() => downloadMockFile('staff_roles_template.csv', 'email,role')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Roles CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
                <button
                  onClick={() => downloadMockFile('staff_access_grants_example.csv', 'email,full_name,is_active\nronen@chamama.org,Ronen Chen,true\nstudio@chamama.org,Chamama Studio,true\nmentor.one@example.test,Mentor One,true')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Mock Grants CSV</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => downloadMockFile('student_groups_template.csv', 'group_name,layer,is_active')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Groups CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
                <button
                  onClick={() => downloadMockFile('students_template.csv', 'external_student_id,first_name,last_name,group_name,primary_phone,secondary_phone,emergency_contact_name,emergency_contact_phone,is_active')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Students CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
                <button
                  onClick={() => downloadMockFile('projects_template.csv', 'external_student_id,project_title,description,status,is_current')}
                  className="flex items-center justify-between rounded-xl border border-line dark:border-ink-secondary bg-surface hover:bg-surface-sunken dark:bg-ink-secondary dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line transition-colors cursor-pointer"
                >
                  <span>Projects CSV Template</span>
                  <Download className="h-4 w-4 text-ink-muted" />
                </button>
              </div>
            )}
          </section>

          {/* Tab-specific secondary controls */}
          {activeTab === 'calendar' && (
            <section className="space-y-4 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-5 shadow-xs">
              <h2 className="text-base font-bold text-ink dark:text-surface flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-accent" />
                Google Calendar Mirror
              </h2>
              <p className="text-xs text-ink-muted leading-normal">
                Outbound-only mirror sync of local calendar events to the institutional calendar.
              </p>

              {!isSyncConfigured ? (
                <div className="rounded-xl bg-surface dark:bg-ink/40 p-3 text-xs text-ink-muted dark:text-ink-muted font-medium leading-normal border border-surface-sunken dark:border-ink-secondary">
                  Google Calendar Outbound Sync is not configured.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label htmlFor="sync-year-select" className="block text-[10px] font-bold text-ink-muted uppercase mb-1">
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
                      className="w-full rounded-xl border border-line dark:border-ink-secondary bg-surface dark:bg-ink px-3 py-2 text-xs text-ink-secondary dark:text-line focus:outline-hidden"
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
                      className="flex-1 rounded-xl border border-line dark:border-ink-secondary hover:bg-surface dark:hover:bg-ink-secondary px-3 py-2 text-xs font-bold text-ink-secondary dark:text-line disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Preview Sync
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncRun}
                      disabled={isSyncPending || !selectedYearId}
                      className="flex-1 rounded-xl bg-accent hover:bg-accent-strong text-white px-3 py-2 text-xs font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSyncPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      Run Sync
                    </button>
                  </div>

                  {syncError && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-350 font-medium leading-normal flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-455 shrink-0 mt-0.5" />
                      <span>{syncError}</span>
                    </div>
                  )}

                  {syncPreview && (
                    <div className="rounded-xl border border-line dark:border-ink-secondary bg-surface/50 dark:bg-ink/40 p-3 space-y-2 text-xs">
                      <div className="font-bold text-ink dark:text-line">Outbound Changes Preview:</div>
                      <ul className="space-y-1.5 text-ink-secondary dark:text-ink-muted">
                        <li className="flex justify-between">
                          <span>Will Create:</span>
                          <span className="font-bold text-accent dark:text-accent-strong">{syncPreview.insertedCount}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Will Update:</span>
                          <span className="font-bold text-status-caution dark:text-status-caution">{syncPreview.updatedCount}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {syncResult && (
                    <div className="rounded-xl border border-line dark:border-ink-secondary bg-accent-soft/20 dark:bg-accent-soft/5 p-3 space-y-2 text-xs">
                      <div className="font-bold text-ink dark:text-line flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Sync Completed
                      </div>
                      <ul className="space-y-1.5 text-ink-secondary dark:text-ink-muted">
                        <li className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-bold text-accent dark:text-accent-strong">{syncResult.insertedCount}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Updated:</span>
                          <span className="font-bold text-status-caution dark:text-status-caution">{syncResult.updatedCount}</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Safety Gate Warning for Staff / Students */}
          {(activeTab === 'staff' || activeTab === 'students') && (
            <section className="rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/5 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-rose-600" />
                Browser Apply Gate Locked
              </h3>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted leading-relaxed">
                Roster updates containing access grants or student profiles are sensitive. Validation and preview are fully enabled here in the browser, but direct commits to the database are locked.
              </p>
              <p className="text-[11px] font-medium text-rose-800 dark:text-rose-455">
                Please use the local operator CLI scripts inside a secure database transaction to complete roster ingestion.
              </p>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN (2/3 width): Upload & Verification Ingest Area */}
        <section className="lg:col-span-2 space-y-6 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-5 shadow-xs">

          {/* A. Calendar Events Tab Ingestion */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-line dark:border-ink-secondary rounded-xl p-6 text-center hover:border-accent/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  id="cal-upload-input"
                  onChange={handleCalendarFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="cal-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold text-accent hover:text-accent-strong"
                >
                  <Upload className="h-8 w-8 text-ink-muted" />
                  <span>Click to select Calendar CSV file</span>
                </label>
              </div>

              {calGlobalError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3.5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-normal">
                    {calGlobalError}
                  </div>
                </div>
              )}

              {calSuccessMsg && (
                <div className="rounded-xl bg-accent-soft dark:bg-accent-soft/20 border border-accent-soft dark:border-accent-soft p-3.5 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent dark:text-accent shrink-0 mt-0.5" />
                  <div className="text-xs text-accent-strong dark:text-accent-soft font-medium leading-normal">
                    {calSuccessMsg}
                  </div>
                </div>
              )}

              {calPreviewRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-t border-surface-sunken dark:border-ink-secondary pt-4">
                    <span className="text-xs font-bold text-ink-secondary dark:text-line">
                      Preview ({calPreviewRows.length} events)
                    </span>
                    <button
                      type="button"
                      onClick={handleCalendarImportApply}
                      disabled={calErrorCount > 0 || isPending}
                      className="rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('admin.importExport.applying')}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          {t('admin.importExport.apply')}
                        </>
                      )}
                    </button>
                  </div>

                  {calErrorCount > 0 && (
                    <p className="text-[10px] font-bold text-rose-650 dark:text-rose-455">
                      {calErrorCount} errors detected. Please fix the CSV and re-upload.
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-surface-sunken dark:border-ink-secondary">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface dark:bg-ink/60 border-b border-surface-sunken dark:border-ink-secondary text-ink-muted font-semibold select-none">
                          <th className="py-2.5 px-3 text-start w-12">Row</th>
                          <th className="py-2.5 px-2 text-start w-16">Status</th>
                          <th className="py-2.5 px-2 text-start">Title</th>
                          <th className="py-2.5 px-2 text-start">Starts At</th>
                          <th className="py-2.5 px-2 text-start">Ends At</th>
                          <th className="py-2.5 px-2 text-start">Visibility</th>
                          <th className="py-2.5 px-2 text-start">Groups</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary">
                        {calPreviewRows.map((row) => {
                          const hasRowErrors = row.errors.length > 0;
                          return (
                            <tr
                              key={row.rowNum}
                              className={hasRowErrors ? 'bg-rose-50/20 dark:bg-rose-950/5' : 'hover:bg-surface/40 dark:hover:bg-ink/10'}
                            >
                              <td className="py-2.5 px-3 font-semibold text-ink-muted">{row.rowNum}</td>
                              <td className="py-2.5 px-2">
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  hasRowErrors ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'bg-accent-soft dark:bg-accent-soft/30 text-accent-strong dark:text-accent'
                                }`}>
                                  {hasRowErrors ? t('admin.importExport.status.invalid') : t('admin.importExport.status.valid')}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="font-bold text-ink dark:text-surface-sunken">{row.title}</div>
                                {hasRowErrors && (
                                  <div className="mt-1 space-y-0.5">
                                    {row.errors.map((err, idx) => (
                                      <div key={idx} className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        &bull; {err}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 font-mono text-[10px] text-ink-secondary dark:text-ink-muted">{row.startsAt}</td>
                              <td className="py-2.5 px-2 font-mono text-[10px] text-ink-secondary dark:text-ink-muted">{row.endsAt}</td>
                              <td className="py-2.5 px-2 text-ink-secondary dark:text-ink-muted capitalize">{row.visibility.replace('_', ' ')}</td>
                              <td className="py-2.5 px-2 text-ink-secondary dark:text-ink-muted truncate max-w-[120px]">
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
            </div>
          )}

          {/* B. Learning Groups Tab Ingestion */}
          {activeTab === 'learningGroups' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-line dark:border-ink-secondary rounded-xl p-6 text-center hover:border-accent/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  id="lg-upload-input"
                  onChange={handleLearningGroupsFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="lg-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-xs font-bold text-accent hover:text-accent-strong"
                >
                  <Upload className="h-8 w-8 text-ink-muted" />
                  <span>Click to select Learning Groups CSV file</span>
                </label>
              </div>

              {lgGlobalError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3.5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-normal">
                    {lgGlobalError}
                  </div>
                </div>
              )}

              {lgSuccessMsg && (
                <div className="rounded-xl bg-accent-soft dark:bg-accent-soft/20 border border-accent-soft dark:border-accent-soft p-3.5 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent dark:text-accent shrink-0 mt-0.5" />
                  <div className="text-xs text-accent-strong dark:text-accent-soft font-medium leading-normal">
                    {lgSuccessMsg}
                  </div>
                </div>
              )}

              {lgPreviewRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-t border-surface-sunken dark:border-ink-secondary pt-4">
                    <span className="text-xs font-bold text-ink-secondary dark:text-line">
                      Preview ({lgPreviewRows.length} groups)
                    </span>
                    <button
                      type="button"
                      onClick={handleLearningGroupsImportApply}
                      disabled={lgErrorCount > 0 || isPending}
                      className="rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('admin.importExport.applying')}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          {t('admin.importExport.apply')}
                        </>
                      )}
                    </button>
                  </div>

                  {lgErrorCount > 0 && (
                    <p className="text-[10px] font-bold text-rose-650 dark:text-rose-455">
                      {lgErrorCount} errors detected. Please fix the CSV and re-upload.
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-surface-sunken dark:border-ink-secondary">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface dark:bg-ink/60 border-b border-surface-sunken dark:border-ink-secondary text-ink-muted font-semibold select-none">
                          <th className="py-2.5 px-3 text-start w-12">Row</th>
                          <th className="py-2.5 px-2 text-start w-16">Status</th>
                          <th className="py-2.5 px-2 text-start">Title</th>
                          <th className="py-2.5 px-2 text-start">Weekday</th>
                          <th className="py-2.5 px-2 text-start">Time</th>
                          <th className="py-2.5 px-2 text-start">Room</th>
                          <th className="py-2.5 px-2 text-start">Leader</th>
                          <th className="py-2.5 px-2 text-start">Groups</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary">
                        {lgPreviewRows.map((row) => {
                          const hasRowErrors = row.errors.length > 0;
                          return (
                            <tr
                              key={row.rowNum}
                              className={hasRowErrors ? 'bg-rose-50/20 dark:bg-rose-950/5' : 'hover:bg-surface/40 dark:hover:bg-ink/10'}
                            >
                              <td className="py-2.5 px-3 font-semibold text-ink-muted">{row.rowNum}</td>
                              <td className="py-2.5 px-2">
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  hasRowErrors ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'bg-accent-soft dark:bg-accent-soft/30 text-accent-strong dark:text-accent'
                                }`}>
                                  {hasRowErrors ? t('admin.importExport.status.invalid') : t('admin.importExport.status.valid')}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="font-bold text-ink dark:text-surface-sunken">{row.title}</div>
                                {hasRowErrors && (
                                  <div className="mt-1 space-y-0.5">
                                    {row.errors.map((err, idx) => (
                                      <div key={idx} className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        &bull; {err}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 capitalize">{row.weekday}</td>
                              <td className="py-2.5 px-2 font-mono text-[10px] text-ink-secondary dark:text-ink-muted">
                                {row.startsAt} - {row.endsAt}
                              </td>
                              <td className="py-2.5 px-2 text-ink-secondary dark:text-ink-muted">{row.room ?? '-'}</td>
                              <td className="py-2.5 px-2 text-ink-secondary dark:text-ink-muted truncate max-w-[100px]" title={row.leaderEmail}>
                                {row.leaderEmail ?? '-'}
                              </td>
                              <td className="py-2.5 px-2 text-ink-secondary dark:text-ink-muted truncate max-w-[120px]">
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
            </div>
          )}

          {/* C. Staff Roster Validation Ingestion */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-line dark:border-ink-secondary p-4 space-y-3">
                  <h3 className="text-xs font-bold text-ink-secondary dark:text-line flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-accent" />
                    1. Staff Access Grants CSV
                  </h3>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'staffGrants')}
                    className="w-full text-xs text-ink-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-surface-sunken dark:file:bg-ink-secondary file:text-ink-secondary dark:file:text-line hover:file:bg-line cursor-pointer"
                  />
                  <div className="text-[10px] text-ink-muted">
                    {rosterFiles.staffGrants ? '✓ File loaded' : 'Missing file'}
                  </div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-4 space-y-3">
                  <h3 className="text-xs font-bold text-ink-secondary dark:text-line flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    2. Staff App Roles CSV
                  </h3>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'staffRoles')}
                    className="w-full text-xs text-ink-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-surface-sunken dark:file:bg-ink-secondary file:text-ink-secondary dark:file:text-line hover:file:bg-line cursor-pointer"
                  />
                  <div className="text-[10px] text-ink-muted">
                    {rosterFiles.staffRoles ? '✓ File loaded' : 'Missing file'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleValidateRoster}
                  disabled={rosterValidating || (!rosterFiles.staffGrants && !rosterFiles.staffRoles)}
                  className="flex-1 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 text-white py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {rosterValidating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify Staff Roster
                </button>
                <button
                  onClick={handleClearRosterFiles}
                  className="rounded-xl border border-line dark:border-ink-secondary hover:bg-surface dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line cursor-pointer transition-colors"
                >
                  Clear Files
                </button>
              </div>

              {renderRosterReport()}
            </div>
          )}

          {/* D. Student Roster Validation Ingestion */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">1. Manifest CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'manifest')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.manifest ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">2. Student Groups CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'studentGroups')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.studentGroups ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">3. Students Roster CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'students')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.students ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">4. Group Mentors CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'groupMentors')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.groupMentors ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">5. Student Projects CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'projects')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.projects ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">6. Student Masters CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'studentMasters')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.studentMasters ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">7. Learning Goals CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'studentGoals')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.studentGoals ? '✓ Loaded' : 'Missing'}</div>
                </div>

                <div className="rounded-xl border border-line dark:border-ink-secondary p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-ink-muted">8. Emotional Baseline CSV</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleRosterFileSelect(e, 'emotionalBaseline')}
                    className="w-full text-[11px] text-ink-muted"
                  />
                  <div className="text-[9px] text-ink-muted">{rosterFiles.emotionalBaseline ? '✓ Loaded' : 'Optional'}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleValidateRoster}
                  disabled={rosterValidating || Object.keys(rosterFiles).length === 0}
                  className="flex-1 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 text-white py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {rosterValidating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify Student Roster
                </button>
                <button
                  onClick={handleClearRosterFiles}
                  className="rounded-xl border border-line dark:border-ink-secondary hover:bg-surface dark:hover:bg-ink-secondary px-4 py-2.5 text-xs font-bold text-ink-secondary dark:text-line cursor-pointer transition-colors"
                >
                  Clear Files
                </button>
              </div>

              {renderRosterReport()}
            </div>
          )}

          {/* E. Operator Notes Tab */}
          {activeTab === 'operatorNotes' && (
            <div className="space-y-5 text-xs text-ink-secondary dark:text-line leading-relaxed">
              <div className="rounded-xl bg-surface dark:bg-ink p-4 border border-line dark:border-ink-secondary space-y-2.5">
                <h3 className="text-sm font-bold text-ink dark:text-surface flex items-center gap-2">
                  <Terminal className="h-4.5 w-4.5 text-accent" />
                  Local Ingestion CLI Commands
                </h3>
                <p>
                  To apply validated rosters to the database, run the following CLI scripts from the root directory. Inserts are fully wrapped in Postgres database transactions with rollback capability.
                </p>
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="font-bold block text-[10px] text-ink-muted uppercase">1. Run Directory Invalidation Check</span>
                    <pre className="mt-1 bg-ink text-surface-sunken p-2.5 rounded-xl font-mono text-[10px] select-all overflow-x-auto">
                      npm run validate:import -- docs/import/examples
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px] text-ink-muted uppercase">2. Dry-Run Ingestion (Simulate & Rollback)</span>
                    <pre className="mt-1 bg-ink text-surface-sunken p-2.5 rounded-xl font-mono text-[10px] select-all overflow-x-auto">
                      IMPORT_DATABASE_URL=&quot;your-supabase-db-connection-string&quot; npm run import:dry-run -- --input docs/import/examples
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px] text-ink-muted uppercase">3. Execute Safe Local Ingestion</span>
                    <pre className="mt-1 bg-ink text-surface-sunken p-2.5 rounded-xl font-mono text-[10px] select-all overflow-x-auto">
                      IMPORT_ALLOW_LOCAL_APPLY=1 IMPORT_DATABASE_URL=&quot;your-supabase-db-connection-string&quot; npm run import:apply:local -- --input docs/import/examples
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-ink dark:text-surface-sunken flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-accent" />
                  Roster Validation Details
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
                  <li><strong>Manifest</strong>: Checks that starts_on date is before ends_on and that owner/operator emails match the whitelisted domain.</li>
                  <li><strong>Staff access & roles</strong>: Enforces active email domain mapping, whitelisted lowercase strings, and valid role assignments.</li>
                  <li><strong>Relational integrity</strong>: Resolves group mentors, student projects, student masters, and goals to actual IDs inside the students roster. Any orphan key triggers a failure.</li>
                  <li><strong>Constraint caps</strong>: Double checks that no student is assigned more than one active current project or primary learning goal.</li>
                </ul>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );

  // Helper to render roster validation results
  function renderRosterReport() {
    if (rosterError) {
      return (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-455 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 dark:text-rose-350 leading-relaxed font-medium">
            {rosterError}
          </div>
        </div>
      );
    }

    if (!rosterReport) return null;

    const hasErrors = rosterReport.errors.length > 0;

    return (
      <div className="space-y-4 pt-4 border-t border-surface-sunken dark:border-ink-secondary">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold ${
            hasErrors
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50'
              : 'bg-accent-soft dark:bg-accent-soft/30 text-accent-strong dark:text-accent border border-accent-soft/50'
          }`}>
            {hasErrors ? 'Roster Validation Failed' : 'Roster Validation Passed'}
          </span>
          <span className="text-[10px] text-ink-muted uppercase font-bold">
            Readiness Report Compiled
          </span>
        </div>

        {/* Counts summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface/50 dark:bg-ink/40 p-4 rounded-xl border border-surface-sunken dark:border-ink-secondary">
          {Object.entries(rosterReport.counts).map(([key, count]) => {
            if (count === 0) return null;
            const labelMap: Record<string, string> = {
              staffGrants: 'Staff Grants',
              staffRoles: 'Staff Roles',
              studentGroups: 'Groups',
              students: 'Students',
              groupMentors: 'Mentors',
              projects: 'Projects',
              studentMasters: 'Masters',
              studentGoals: 'Goals',
              emotionalBaselines: 'Baselines',
            };
            return (
              <div key={key} className="text-center md:text-start">
                <span className="block text-[10px] text-ink-muted font-bold uppercase">{labelMap[key] || key}</span>
                <span className="text-lg font-black text-ink-secondary dark:text-line">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Errors list */}
        {rosterReport.errors.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase">
              <AlertCircle className="h-4.5 w-4.5" />
              {t('admin.importExport.errors.title')} ({rosterReport.errors.length})
            </h4>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-rose-200/40 bg-rose-50/10 dark:bg-rose-950/5 p-3 space-y-1.5 font-mono text-[10px] text-rose-800 dark:text-rose-350">
              {rosterReport.errors.map((err, idx) => (
                <div key={idx} className="leading-relaxed border-b border-rose-200/10 pb-1 last:border-0 last:pb-0">
                  &bull; {err}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings list */}
        {rosterReport.warnings.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-status-caution dark:text-status-caution flex items-center gap-1.5 uppercase">
              <Clock className="h-4.5 w-4.5" />
              {t('admin.importExport.warnings.title')} ({rosterReport.warnings.length})
            </h4>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-status-caution-soft/40 bg-status-caution-soft/10 dark:bg-status-caution-soft/5 p-3 space-y-1.5 font-mono text-[10px] text-status-caution dark:text-status-caution-soft">
              {rosterReport.warnings.map((warn, idx) => (
                <div key={idx} className="leading-relaxed border-b border-status-caution-soft/10 pb-1 last:border-0 last:pb-0">
                  &bull; {warn}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
