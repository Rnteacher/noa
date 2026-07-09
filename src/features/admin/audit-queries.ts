import 'server-only';
import { createClient } from '@/lib/supabase/server';

const AUDIT_LOG_LIMIT = 100;
const FILTER_OPTIONS_LIMIT = 500;

export type AdminAuditLogRow = {
  id: string;
  actorId: string | null;
  actorName: string | null;
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
};

export type AdminAuditLogData = {
  logs: AdminAuditLogRow[];
  actionOptions: string[];
  entityTypeOptions: string[];
  filters: AdminAuditLogFilters;
  isAuthorized: boolean;
  error: string | null;
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
  profiles: { full_name: string } | { full_name: string }[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyAuditLogData(
  filters: AdminAuditLogFilters,
  isAuthorized: boolean,
  error: string | null
): AdminAuditLogData {
  return { logs: [], actionOptions: [], entityTypeOptions: [], filters, isAuthorized, error };
}

export async function getAdminAuditLogs(
  rawFilters: AdminAuditLogFilters
): Promise<AdminAuditLogData> {
  const filters: AdminAuditLogFilters = {
    action: rawFilters.action?.trim() || undefined,
    entityType: rawFilters.entityType?.trim() || undefined,
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
      'id, actor_id, action, entity_type, entity_id, before_data, after_data, created_at, profiles:actor_id(full_name)'
    )
    .order('created_at', { ascending: false })
    .limit(AUDIT_LOG_LIMIT);

  if (filters.action) {
    logsQuery = logsQuery.eq('action', filters.action);
  }

  if (filters.entityType) {
    logsQuery = logsQuery.eq('entity_type', filters.entityType);
  }

  const [logsResult, actionOptionsResult, entityTypeOptionsResult] = await Promise.all([
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

  return {
    logs,
    actionOptions,
    entityTypeOptions,
    filters,
    isAuthorized: true,
    error: null,
  };
}
