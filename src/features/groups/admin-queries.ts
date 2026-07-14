import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  AdminGroup,
  AdminGroupMentor,
  AdminGroupSchoolYearOption,
  AdminMentorOption,
  GroupStateFilter,
} from './types';

export type AdminGroupsData = {
  groups: AdminGroup[];
  mentorOptions: AdminMentorOption[];
  schoolYearOptions: AdminGroupSchoolYearOption[];
  state: GroupStateFilter;
  isAuthorized: boolean;
  error: string | null;
};

function emptyAdminGroupsData(
  state: GroupStateFilter,
  isAuthorized: boolean,
  error: string | null
): AdminGroupsData {
  return { groups: [], mentorOptions: [], schoolYearOptions: [], state, isAuthorized, error };
}

type SchoolYearRelation = { name: string };
type ProfileRelation = { full_name: string };

type GroupRow = {
  id: string;
  name: string;
  layer: string | null;
  school_year_id: string;
  is_active: boolean;
  updated_at: string;
  school_years: SchoolYearRelation | SchoolYearRelation[] | null;
};

type MentorRow = {
  id: string;
  group_id: string;
  mentor_id: string;
  is_primary: boolean;
  active_from: string;
  active_until: string | null;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getAdminGroupsData(rawState: string | undefined): Promise<AdminGroupsData> {
  const state: GroupStateFilter =
    rawState === 'inactive' || rawState === 'all' ? rawState : 'active';

  const supabase = await createClient();

  const { data: claimsData, error: userError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userError || !userId) {
    return emptyAdminGroupsData(state, false, 'dashboard.error.noSession');
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return emptyAdminGroupsData(state, false, 'admin.groups.errorForbidden');
  }

  let groupsQuery = supabase
    .from('student_groups')
    .select('id, name, layer, school_year_id, is_active, updated_at, school_years:school_year_id(name)')
    .order('name');

  if (state !== 'all') {
    groupsQuery = groupsQuery.eq('is_active', state === 'active');
  }

  const [
    { data: groupsData, error: groupsError },
    { data: mentorsData },
    { data: studentsData },
    { data: mentorOptionsData },
    { data: schoolYearsData },
  ] = await Promise.all([
    groupsQuery,
    supabase
      .from('group_mentors')
      .select('id, group_id, mentor_id, is_primary, active_from, active_until, profiles:mentor_id(full_name)')
      .is('active_until', null),
    supabase.from('students').select('group_id').eq('is_active', true),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('school_years').select('id, name').order('starts_on', { ascending: false }),
  ]);

  if (groupsError) {
    console.error('Failed to load admin groups:', groupsError);
    return emptyAdminGroupsData(state, true, 'admin.groups.errorLoadFailed');
  }

  const studentCountByGroup = new Map<string, number>();
  for (const row of studentsData ?? []) {
    studentCountByGroup.set(row.group_id, (studentCountByGroup.get(row.group_id) ?? 0) + 1);
  }

  const mentorsByGroup = new Map<string, AdminGroupMentor[]>();
  for (const row of (mentorsData ?? []) as MentorRow[]) {
    const profile = relationOne(row.profiles);
    const entry: AdminGroupMentor = {
      id: row.id,
      mentorId: row.mentor_id,
      mentorName: profile?.full_name ?? '',
      isPrimary: row.is_primary,
      activeFrom: row.active_from,
      activeUntil: row.active_until,
    };
    const list = mentorsByGroup.get(row.group_id) ?? [];
    list.push(entry);
    mentorsByGroup.set(row.group_id, list);
  }

  const groups: AdminGroup[] = ((groupsData ?? []) as GroupRow[]).map((row) => {
    const schoolYear = relationOne(row.school_years);
    return {
      id: row.id,
      name: row.name,
      layer: row.layer,
      schoolYearId: row.school_year_id,
      schoolYearName: schoolYear?.name ?? '',
      isActive: row.is_active,
      studentCount: studentCountByGroup.get(row.id) ?? 0,
      mentors: mentorsByGroup.get(row.id) ?? [],
      updatedAt: row.updated_at,
    };
  });

  return {
    groups,
    mentorOptions: (mentorOptionsData ?? []).map((mentor) => ({ id: mentor.id, fullName: mentor.full_name })),
    schoolYearOptions: (schoolYearsData ?? []).map((schoolYear) => ({ id: schoolYear.id, name: schoolYear.name })),
    state,
    isAuthorized: true,
    error: null,
  };
}
