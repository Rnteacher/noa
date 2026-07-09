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
  const action = searchParams.get('action')?.trim();
  const entityType = searchParams.get('entityType')?.trim();
  const actorId = searchParams.get('actorId')?.trim();
  const fromDate = parseLocalDate(searchParams.get('fromDate'));
  const toDate = parseLocalDate(searchParams.get('toDate'));

  let query = supabase
    .from('audit_logs')
    .select('created_at, action, entity_type, entity_id, profiles:actor_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (action) {
    query = query.eq('action', action);
  }
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  if (actorId) {
    query = query.eq('actor_id', actorId);
  }
  if (fromDate) {
    query = query.gte('created_at', `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    const [year, month, day] = toDate.split('-').map(Number);
    const nextDayStr = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().split('T')[0];
    query = query.lt('created_at', `${nextDayStr}T00:00:00.000Z`);
  }

  const { data: logs, error: queryError } = await query;

  if (queryError) {
    console.error('Audit CSV export query failed:', queryError);
    return new Response('Internal Server Error', { status: 500 });
  }

  // Generate CSV
  const headers = ['Date', 'Actor Name', 'Actor Email', 'Action', 'Entity Type', 'Entity ID'];
  const csvRows = [headers.join(',')];

  for (const log of logs ?? []) {
    const actor = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    const row = [
      log.created_at,
      actor?.full_name ?? '',
      actor?.email ?? '',
      log.action,
      log.entity_type,
      log.entity_id ?? '',
    ];
    csvRows.push(row.map(escapeCsvCell).join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvBytes = new TextEncoder().encode(csvContent);

  // Log export audit trail using service role writeAuditLog helper
  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'audit_log.exported',
      entityType: 'audit_log',
      afterData: {
        filters: { action, entityType, actorId, fromDate, toDate },
        rowCount: logs?.length ?? 0,
      },
    });
  } catch (logErr) {
    console.error('Failed to log audit export activity:', logErr);
  }

  return new Response(csvBytes, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="audit_log_export.csv"',
      'Content-Length': String(csvBytes.length),
    },
  });
}
