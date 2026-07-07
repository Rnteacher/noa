import 'server-only';
import { createServiceRoleClient } from '@/lib/auth/admin';
import type { Json } from '@/types/supabase';

type AuditLogInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: Json | null;
  afterData?: Json | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  const admin = createServiceRoleClient();
  const { error } = await admin.from('audit_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
  });

  if (error) {
    throw error;
  }
}
