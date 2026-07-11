import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';

function parseLocalDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return dateStr;
  }
  return undefined;
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fromDate = parseLocalDate(searchParams.get('fromDate'));
  const toDate = parseLocalDate(searchParams.get('toDate'));
  const visibility = searchParams.get('visibility')?.trim();
  const groupId = searchParams.get('groupId')?.trim();

  let query = supabase
    .from('calendar_events')
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      is_all_day,
      visibility,
      location,
      google_calendar_event_id,
      updated_at,
      calendar_event_groups(group_id, student_groups:group_id(name))
    `)
    .order('starts_at', { ascending: true });

  if (fromDate) {
    query = query.gte('starts_at', `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    query = query.lte('ends_at', `${toDate}T23:59:59.999Z`);
  }
  if (visibility) {
    query = query.eq('visibility', visibility);
  }

  const { data: rawEvents, error: queryError } = await query;

  if (queryError) {
    console.error('Calendar export query failed:', queryError);
    return new Response('Internal Server Error', { status: 500 });
  }

  let eventsData = rawEvents ?? [];
  if (groupId) {
    eventsData = eventsData.filter((event) =>
      (event.calendar_event_groups ?? []).some((g) => g.group_id === groupId)
    );
  }

  const headers = [
    'event_id',
    'title',
    'description',
    'starts_at',
    'ends_at',
    'is_all_day',
    'visibility',
    'location',
    'target_group_names',
    'target_group_ids',
    'google_calendar_event_id',
    'updated_at',
  ];

  const csvRows = [headers.join(',')];

  for (const event of eventsData) {
    const targetGroups = (event.calendar_event_groups ?? []).flatMap((link) => {
      const studentGroups = link.student_groups as { name: string } | { name: string }[] | null;
      const group = Array.isArray(studentGroups) ? studentGroups[0] : studentGroups;
      return group ? [{ id: link.group_id, name: group.name }] : [];
    });

    const targetGroupNames = targetGroups.map((g) => g.name).join(';');
    const targetGroupIds = targetGroups.map((g) => g.id).join(';');

    const row = [
      event.id,
      event.title,
      event.description ?? '',
      event.starts_at,
      event.ends_at,
      event.is_all_day ? 'true' : 'false',
      event.visibility,
      event.location ?? '',
      targetGroupNames,
      targetGroupIds,
      event.google_calendar_event_id ?? '',
      event.updated_at,
    ];
    csvRows.push(row.map(escapeCsvCell).join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvBytes = new TextEncoder().encode(csvContent);

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'calendar_events.exported',
      entityType: 'calendar_event',
      afterData: {
        filters: { fromDate, toDate, visibility, groupId },
        rowCount: eventsData.length,
      },
    });
  } catch (logErr) {
    console.error('Failed to log calendar export audit:', logErr);
  }

  return new Response(csvBytes, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendar_events_export.csv"',
      'Content-Length': String(csvBytes.length),
    },
  });
}
