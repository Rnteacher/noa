import 'server-only';
import { createClient } from '@/lib/supabase/server';

const FILTER_OPTIONS_LIMIT = 500;

export type AdminAuditLogRow = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
};

export type AdminAuditLogFilters = {
  action?: string;
  entityType?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export type AdminAuditLogData = {
  logs: AdminAuditLogRow[];
  actionOptions: string[];
  entityTypeOptions: string[];
  actorOptions: Array<{ id: string; fullName: string; email: string }>;
  filters: AdminAuditLogFilters;
  isAuthorized: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseLocalDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return dateStr;
  }
  return undefined;
}

function emptyAuditLogData(
  filters: AdminAuditLogFilters,
  isAuthorized: boolean,
  error: string | null
): AdminAuditLogData {
  return {
    logs: [],
    actionOptions: [],
    entityTypeOptions: [],
    actorOptions: [],
    filters,
    isAuthorized,
    error,
    totalCount: 0,
    currentPage: filters.page || 1,
    pageSize: filters.pageSize || 50,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  };
}

export async function getAdminAuditLogs(
  rawFilters: AdminAuditLogFilters
): Promise<AdminAuditLogData> {
  const page = Math.max(1, Number(rawFilters.page) || 1);
  const rawPageSize = Number(rawFilters.pageSize) || 50;
  const pageSize = [25, 50, 100].includes(rawPageSize) ? rawPageSize : 50;

  const filters: AdminAuditLogFilters = {
    action: rawFilters.action?.trim() || undefined,
    entityType: rawFilters.entityType?.trim() || undefined,
    actorId: rawFilters.actorId?.trim() || undefined,
    fromDate: parseLocalDate(rawFilters.fromDate),
    toDate: parseLocalDate(rawFilters.toDate),
    page,
    pageSize,
  };

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return emptyAuditLogData(filters, false, 'dashboard.error.noSession');
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return emptyAuditLogData(filters, false, 'admin.audit.errorForbidden');
  }

  let logsQuery = supabase
    .from('audit_logs')
    .select(
      'id, actor_id, action, entity_type, entity_id, before_data, after_data, created_at, profiles:actor_id(full_name, email)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (filters.action) {
    logsQuery = logsQuery.eq('action', filters.action);
  }

  if (filters.entityType) {
    logsQuery = logsQuery.eq('entity_type', filters.entityType);
  }

  if (filters.actorId) {
    logsQuery = logsQuery.eq('actor_id', filters.actorId);
  }

  if (filters.fromDate) {
    logsQuery = logsQuery.gte('created_at', `${filters.fromDate}T00:00:00.000Z`);
  }

  if (filters.toDate) {
    const [year, month, day] = filters.toDate.split('-').map(Number);
    const nextDayStr = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().split('T')[0];
    logsQuery = logsQuery.lt('created_at', `${nextDayStr}T00:00:00.000Z`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  logsQuery = logsQuery.range(from, to);

  const [logsResult, actionOptionsResult, entityTypeOptionsResult, actorsResult] = await Promise.all([
    logsQuery,
    supabase
      .from('audit_logs')
      .select('action')
      .order('created_at', { ascending: false })
      .limit(FILTER_OPTIONS_LIMIT),
    supabase
      .from('audit_logs')
      .select('entity_type')
      .order('created_at', { ascending: false })
      .limit(FILTER_OPTIONS_LIMIT),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name'),
  ]);

  if (logsResult.error) {
    console.error('Failed to load admin audit logs:', logsResult.error);
    return emptyAuditLogData(filters, true, 'admin.audit.errorLoadFailed');
  }

  const logs: AdminAuditLogRow[] = ((logsResult.data ?? []) as AuditLogRow[]).map((row) => {
    const actor = relationOne(row.profiles);
    return {
      id: row.id,
      actorId: row.actor_id,
      actorName: actor?.full_name ?? null,
      actorEmail: actor?.email ?? null,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      beforeData: row.before_data,
      afterData: row.after_data,
      createdAt: row.created_at,
    };
  });

  const actionOptions = Array.from(
    new Set((actionOptionsResult.data ?? []).map((row) => row.action))
  ).sort();

  const entityTypeOptions = Array.from(
    new Set((entityTypeOptionsResult.data ?? []).map((row) => row.entity_type))
  ).sort();

  const actorOptions = (actorsResult.data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
  }));

  const totalCount = logsResult.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    logs,
    actionOptions,
    entityTypeOptions,
    actorOptions,
    filters,
    isAuthorized: true,
    error: null,
    totalCount,
    currentPage: page,
    pageSize,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}
