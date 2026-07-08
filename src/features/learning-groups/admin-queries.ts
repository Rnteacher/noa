import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  LEARNING_GROUP_WEEKDAYS,
  type AdminLearningGroup,
  type AdminLearningGroupLeaderOption,
  type AdminLearningGroupOption,
  type LearningGroupStateFilter,
  type LearningGroupWeekday,
} from '@/features/learning-groups/types';

export type AdminLearningGroupsData = {
  learningGroups: AdminLearningGroup[];
  groups: AdminLearningGroupOption[];
  leaders: AdminLearningGroupLeaderOption[];
  currentSchoolYear: { id: string; startsOn: string; endsOn: string } | null;
  weekday: LearningGroupWeekday | 'all';
  state: LearningGroupStateFilter;
  isAuthorized: boolean;
  error: string | null;
};

type ProfileRelation = { full_name: string };
type StudentGroupRelation = { name: string };

type LearningGroupRow = {
  id: string;
  title: string;
  description: string | null;
  weekday: LearningGroupWeekday;
  starts_at: string;
  ends_at: string;
  leader_id: string | null;
  room: string | null;
  active_from: string;
  active_until: string | null;
  is_active: boolean;
  updated_at: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
  learning_group_target_groups:
    | {
        group_id: string;
        student_groups: StudentGroupRelation | StudentGroupRelation[] | null;
      }[]
    | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyAdminLearningGroupsData(
  weekday: LearningGroupWeekday | 'all',
  state: LearningGroupStateFilter,
  isAuthorized: boolean,
  error: string | null
): AdminLearningGroupsData {
  return {
    learningGroups: [],
    groups: [],
    leaders: [],
    currentSchoolYear: null,
    weekday,
    state,
    isAuthorized,
    error,
  };
}

const LEARNING_GROUP_SELECT = `
  id,
  title,
  description,
  weekday,
  starts_at,
  ends_at,
  leader_id,
  room,
  active_from,
  active_until,
  is_active,
  updated_at,
  profiles:leader_id(full_name),
  learning_group_target_groups(group_id, student_groups:group_id(name))
`;

export async function getAdminLearningGroupsData(
  rawWeekday: string | undefined,
  rawState: string | undefined
): Promise<AdminLearningGroupsData> {
  const weekday: LearningGroupWeekday | 'all' = LEARNING_GROUP_WEEKDAYS.includes(
    rawWeekday as LearningGroupWeekday
  )
    ? (rawWeekday as LearningGroupWeekday)
    : 'all';

  const state: LearningGroupStateFilter =
    rawState === 'inactive' || rawState === 'all' ? rawState : 'active';

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return emptyAdminLearningGroupsData(weekday, state, false, 'dashboard.error.noSession');
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return emptyAdminLearningGroupsData(
      weekday,
      state,
      false,
      'admin.learningGroups.errorForbidden'
    );
  }

  let query = supabase
    .from('learning_groups')
    .select(LEARNING_GROUP_SELECT)
    .order('weekday', { ascending: true })
    .order('starts_at', { ascending: true })
    .order('title', { ascending: true });

  if (weekday !== 'all') {
    query = query.eq('weekday', weekday);
  }

  if (state !== 'all') {
    query = query.eq('is_active', state === 'active');
  }

  const [
    { data: learningGroupsData, error: learningGroupsError },
    { data: groupsData },
    { data: leadersData },
    { data: currentSchoolYear },
  ] = await Promise.all([
    query,
    supabase.from('student_groups').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase
      .from('school_years')
      .select('id, starts_on, ends_on')
      .eq('is_current', true)
      .maybeSingle(),
  ]);

  if (learningGroupsError) {
    console.error('Failed to load admin learning groups:', learningGroupsError);
    return emptyAdminLearningGroupsData(
      weekday,
      state,
      true,
      'admin.learningGroups.errorLoadFailed'
    );
  }

  const learningGroups: AdminLearningGroup[] = ((learningGroupsData ?? []) as LearningGroupRow[])
    .map((row) => {
      const leader = relationOne(row.profiles);
      const targetGroups = (row.learning_group_target_groups ?? []).flatMap((link) => {
        const group = relationOne(link.student_groups);
        return group ? [{ id: link.group_id, name: group.name }] : [];
      });

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        weekday: row.weekday,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        leaderId: row.leader_id,
        leaderName: leader?.full_name ?? null,
        room: row.room,
        activeFrom: row.active_from,
        activeUntil: row.active_until,
        isActive: row.is_active,
        targetGroupIds: targetGroups.map((group) => group.id),
        targetGroupNames: targetGroups.map((group) => group.name),
        updatedAt: row.updated_at,
      };
    });

  return {
    learningGroups,
    groups: groupsData ?? [],
    leaders:
      leadersData?.map((leader) => ({
        id: leader.id,
        fullName: leader.full_name,
      })) ?? [],
    currentSchoolYear: currentSchoolYear
      ? {
          id: currentSchoolYear.id,
          startsOn: currentSchoolYear.starts_on,
          endsOn: currentSchoolYear.ends_on,
        }
      : null,
    weekday,
    state,
    isAuthorized: true,
    error: null,
  };
}
