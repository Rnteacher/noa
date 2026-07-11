import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
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

  const { data: rawGroups, error: queryError } = await supabase
    .from('learning_groups')
    .select(`
      id,
      title,
      description,
      weekday,
      starts_at,
      ends_at,
      room,
      leader_id,
      active_from,
      active_until,
      is_active,
      updated_at,
      profiles:leader_id(full_name, email),
      learning_group_target_groups(group_id, student_groups:group_id(name))
    `)
    .order('weekday', { ascending: true })
    .order('starts_at', { ascending: true });

  if (queryError) {
    console.error('Learning groups export query failed:', queryError);
    return new Response('Internal Server Error', { status: 500 });
  }

  const headers = [
    'learning_group_id',
    'title',
    'description',
    'weekday',
    'starts_at',
    'ends_at',
    'room',
    'leader_email',
    'leader_name',
    'target_group_names',
    'target_group_ids',
    'active_from',
    'active_until',
    'is_active',
    'updated_at',
  ];

  const csvRows = [headers.join(',')];

  for (const group of rawGroups ?? []) {
    const leader = Array.isArray(group.profiles) ? group.profiles[0] : group.profiles;
    
    const targetGroups = (group.learning_group_target_groups ?? []).flatMap((link) => {
      const studentGroups = link.student_groups as { name: string } | { name: string }[] | null;
      const grp = Array.isArray(studentGroups) ? studentGroups[0] : studentGroups;
      return grp ? [{ id: link.group_id, name: grp.name }] : [];
    });

    const targetGroupNames = targetGroups.map((g) => g.name).join(';');
    const targetGroupIds = targetGroups.map((g) => g.id).join(';');

    const row = [
      group.id,
      group.title,
      group.description ?? '',
      group.weekday,
      group.starts_at,
      group.ends_at,
      group.room ?? '',
      leader?.email ?? '',
      leader?.full_name ?? '',
      targetGroupNames,
      targetGroupIds,
      group.active_from,
      group.active_until ?? '',
      group.is_active ? 'true' : 'false',
      group.updated_at,
    ];
    csvRows.push(row.map(escapeCsvCell).join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvBytes = new TextEncoder().encode(csvContent);

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'learning_groups.exported',
      entityType: 'learning_group',
      afterData: {
        rowCount: rawGroups?.length ?? 0,
      },
    });
  } catch (logErr) {
    console.error('Failed to log learning groups export audit:', logErr);
  }

  return new Response(csvBytes, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="learning_groups_export.csv"',
      'Content-Length': String(csvBytes.length),
    },
  });
}
