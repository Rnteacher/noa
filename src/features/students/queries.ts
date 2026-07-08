import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  StudentCardData,
  StudentContact,
  StudentGoal,
  StudentListData,
  StudentListItem,
  StudentMessage,
  StudentPerson,
} from '@/features/students/types';

const STUDENT_LIMIT = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StudentGroupRelation = { name: string; layer: string | null };

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  group_id: string;
  primary_phone: string | null;
  secondary_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: string;
  student_groups: StudentGroupRelation | StudentGroupRelation[] | null;
};

type ProfileRelation = { full_name: string };

type PersonAssignmentRow = {
  id: string;
  is_primary: boolean;
  mentor_id?: string;
  master_id?: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

type MessageRow = {
  id: string;
  author_id: string | null;
  body: string;
  tags: StudentMessage['tags'];
  is_important: boolean;
  created_at: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  status: StudentGoal['status'];
  is_primary: boolean;
};

function normalizeSearchQuery(value: string | undefined) {
  return (value ?? '').trim().replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 80);
}

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyStudentList(query: string, error: string | null): StudentListData {
  return {
    query,
    students: [],
    error,
  };
}

function emptyStudentCard(error: string | null): StudentCardData {
  return {
    student: null,
    contacts: [],
    mentors: [],
    project: null,
    emotionalStatus: null,
    canUpdateEmotionalStatus: false,
    canManageGoals: false,
    canDeleteGoals: false,
    canManagePhoto: false,
    goals: [],
    messages: [],
    isFollowed: false,
    error,
  };
}

async function requireActiveUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, userId: null, error: 'students.error.noSession' };
  }

  const { data: isActiveStaff, error: activeError } = await supabase.rpc(
    'current_user_is_active_staff'
  );

  if (activeError || !isActiveStaff) {
    return { supabase, userId: user.id, error: 'students.error.noProfile' };
  }

  return { supabase, userId: user.id, error: null };
}

export async function getStudentList(rawQuery?: string): Promise<StudentListData> {
  const query = normalizeSearchQuery(rawQuery);
  const { supabase, error } = await requireActiveUser();

  if (error) {
    return emptyStudentList(query, error);
  }

  let request = supabase
    .from('students')
    .select(
      `
        id,
        first_name,
        last_name,
        photo_url,
        group_id,
        primary_phone,
        secondary_phone,
        emergency_contact_name,
        emergency_contact_phone,
        updated_at,
        student_groups:group_id(name, layer)
      `
    )
    .eq('is_active', true)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(STUDENT_LIMIT);

  if (query) {
    request = request.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
  }

  const { data: students, error: studentsError } = await request;

  if (studentsError) {
    return emptyStudentList(query, 'students.error.searchFailed');
  }

  const rows = (students ?? []) as StudentRow[];
  const studentIds = rows.map((student) => student.id);

  const { data: projects } =
    studentIds.length > 0
      ? await supabase
          .from('current_student_project_statuses')
          .select('student_id, title, status')
          .in('student_id', studentIds)
      : { data: [] };

  const projectsByStudentId = new Map(
    (projects ?? [])
      .filter((project) => project.student_id && project.title && project.status)
      .map((project) => [
        project.student_id as string,
        {
          title: project.title as string,
          status: project.status,
        },
      ])
  );

  return {
    query,
    students: rows.map<StudentListItem>((student) => {
      const group = relationOne(student.student_groups);

      return {
        id: student.id,
        fullName: fullName(student.first_name, student.last_name),
        initials: initials(student.first_name, student.last_name),
        groupName: group?.name ?? null,
        project: projectsByStudentId.get(student.id) ?? null,
      };
    }),
    error: null,
  };
}

export async function getStudentCard(studentId: string): Promise<StudentCardData> {
  if (!UUID_PATTERN.test(studentId)) {
    return emptyStudentCard('students.card.notFoundDescription');
  }

  const { supabase, userId, error } = await requireActiveUser();

  if (error || !userId) {
    return emptyStudentCard(error);
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(
      `
        id,
        first_name,
        last_name,
        photo_url,
        group_id,
        primary_phone,
        secondary_phone,
        emergency_contact_name,
        emergency_contact_phone,
        updated_at,
        student_groups:group_id(name, layer)
      `
    )
    .eq('id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  if (studentError || !student) {
    return emptyStudentCard('students.card.notFoundDescription');
  }

  const studentRow = student as StudentRow;
  const group = relationOne(studentRow.student_groups);

  const [
    mentorsResult,
    projectResult,
    emotionalResult,
    goalsResult,
    messagesResult,
    followedResult,
  ] = await Promise.all([
    supabase
      .from('group_mentors')
      .select('id, is_primary, profiles:mentor_id(full_name)')
      .eq('group_id', studentRow.group_id)
      .is('active_until', null)
      .order('is_primary', { ascending: false }),
    supabase
      .from('current_student_project_statuses')
      .select('project_id, title, status, updated_at')
      .eq('student_id', studentId)
      .maybeSingle(),
    supabase
      .from('latest_student_emotional_statuses')
      .select('status, created_at')
      .eq('student_id', studentId)
      .maybeSingle(),
    supabase
      .from('student_goals')
      .select('id, title, description, status, is_primary')
      .eq('student_id', studentId)
      .neq('status', 'archived')
      .order('is_primary', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('student_messages')
      .select('id, author_id, body, tags, is_important, created_at, profiles:author_id(full_name)')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('followed_students')
      .select('id')
      .eq('profile_id', userId)
      .eq('student_id', studentId)
      .maybeSingle(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const [
    emotionalRowPermissionResult,
    goalsRowPermissionResult,
    photoRowPermissionResult,
    emotionalManagerOrSuperAdminResult,
    counselorRoleResult,
    mentorAssignmentResult,
  ] = await Promise.all([
    supabase.rpc('current_user_can_update_student_emotional_status', {
      target_student_id: studentId,
    }),
    supabase.rpc('current_user_can_update_student_goals', {
      target_student_id: studentId,
    }),
    supabase.rpc('current_user_can_manage_student_photo', {
      target_student_id: studentId,
    }),
    supabase.rpc('current_user_is_manager_or_super_admin'),
    supabase.rpc('current_user_has_role', { required_role: 'counselor' }),
    supabase
      .from('group_mentors')
      .select('id')
      .eq('group_id', studentRow.group_id)
      .eq('mentor_id', userId)
      .lte('active_from', today)
      .or(`active_until.is.null,active_until.gte.${today}`)
      .limit(1)
      .maybeSingle(),
  ]);

  const isManagerOrSuperAdmin = Boolean(
    emotionalManagerOrSuperAdminResult.data && !emotionalManagerOrSuperAdminResult.error
  );
  const isActiveGroupMentor = Boolean(
    mentorAssignmentResult.data && !mentorAssignmentResult.error
  );

  const canUpdateEmotionalStatus = Boolean(
    emotionalRowPermissionResult.data &&
      !emotionalRowPermissionResult.error &&
      (isManagerOrSuperAdmin ||
        (counselorRoleResult.data && !counselorRoleResult.error) ||
        isActiveGroupMentor)
  );

  const canManageGoals = Boolean(
    goalsRowPermissionResult.data &&
      !goalsRowPermissionResult.error &&
      (isManagerOrSuperAdmin || isActiveGroupMentor)
  );

  const canDeleteGoals = isManagerOrSuperAdmin;

  const canManagePhoto = Boolean(
    photoRowPermissionResult.data &&
      !photoRowPermissionResult.error &&
      (isManagerOrSuperAdmin || isActiveGroupMentor)
  );

  let projectMasters: StudentPerson[] = [];
  const project = projectResult.data;
  let canUpdateProjectStatus = false;

  if (project?.project_id) {
    const [
      mastersResult,
      rowPermissionResult,
      managerOrSuperAdminResult,
      projectMasterAssignmentResult,
    ] = await Promise.all([
      supabase
        .from('student_masters')
        .select('id, master_id, is_primary, profiles:master_id(full_name)')
        .eq('student_id', studentId)
        .eq('project_id', project.project_id)
        .is('active_until', null)
        .order('is_primary', { ascending: false }),
      supabase.rpc('current_user_can_update_student_project', {
        target_student_id: studentId,
      }),
      supabase.rpc('current_user_is_manager_or_super_admin'),
      supabase
        .from('student_masters')
        .select('id')
        .eq('student_id', studentId)
        .eq('project_id', project.project_id)
        .eq('master_id', userId)
        .lte('active_from', today)
        .or(`active_until.is.null,active_until.gte.${today}`)
        .maybeSingle(),
    ]);

    canUpdateProjectStatus = Boolean(
      rowPermissionResult.data &&
        !rowPermissionResult.error &&
        ((managerOrSuperAdminResult.data && !managerOrSuperAdminResult.error) ||
          (projectMasterAssignmentResult.data && !projectMasterAssignmentResult.error))
    );

    projectMasters = ((mastersResult.data ?? []) as PersonAssignmentRow[]).flatMap((row) => {
      const profile = relationOne(row.profiles);
      return profile
        ? [{
            id: row.id,
            profileId: row.master_id ?? null,
            fullName: profile.full_name,
            isPrimary: row.is_primary,
          }]
        : [];
    });
  }

  const contacts: StudentContact[] = [
    studentRow.primary_phone
      ? { labelKey: 'students.card.primaryPhone', value: studentRow.primary_phone }
      : null,
    studentRow.secondary_phone
      ? { labelKey: 'students.card.secondaryPhone', value: studentRow.secondary_phone }
      : null,
    studentRow.emergency_contact_name
      ? {
          labelKey: 'students.card.emergencyContact',
          value: studentRow.emergency_contact_name,
        }
      : null,
    studentRow.emergency_contact_phone
      ? {
          labelKey: 'students.card.emergencyPhone',
          value: studentRow.emergency_contact_phone,
        }
      : null,
  ].filter((contact): contact is StudentContact => Boolean(contact));

  const mentors = ((mentorsResult.data ?? []) as PersonAssignmentRow[]).flatMap(
    (row) => {
      const profile = relationOne(row.profiles);
      return profile
        ? [{
            id: row.id,
            profileId: row.mentor_id ?? null,
            fullName: profile.full_name,
            isPrimary: row.is_primary,
          }]
        : [];
    }
  );

  const messages = ((messagesResult.data ?? []) as MessageRow[])
    .slice()
    .reverse()
    .map<StudentMessage>((message) => {
      const author = relationOne(message.profiles);
      return {
        id: message.id,
        authorId: message.author_id,
        authorName: author?.full_name ?? null,
        body: message.body,
        tags: message.tags,
        isImportant: message.is_important,
        createdAt: message.created_at,
      };
    });

  let photoUrl: string | null = null;
  if (studentRow.photo_url) {
    if (studentRow.photo_url.startsWith('http://') || studentRow.photo_url.startsWith('https://')) {
      photoUrl = studentRow.photo_url;
    } else {
      const { data: signedData } = await supabase.storage
        .from('student-photos')
        .createSignedUrl(studentRow.photo_url, 3600);
      photoUrl = signedData?.signedUrl ?? null;
    }
  }

  return {
    student: {
      id: studentRow.id,
      fullName: fullName(studentRow.first_name, studentRow.last_name),
      initials: initials(studentRow.first_name, studentRow.last_name),
      photoUrl: photoUrl,
      groupName: group?.name ?? null,
      groupLayer: group?.layer ?? null,
      updatedAt: studentRow.updated_at,
    },
    contacts,
    mentors,
    project:
      project?.title && project.status
        ? {
            id: project.project_id,
            title: project.title,
            status: project.status,
            statusSince: project.updated_at,
            masters: projectMasters,
            canUpdateStatus: canUpdateProjectStatus,
          }
        : null,
    emotionalStatus:
      emotionalResult.data?.status
        ? {
            status: emotionalResult.data.status,
            statusSince: emotionalResult.data.created_at,
          }
        : null,
    canUpdateEmotionalStatus,
    canManageGoals,
    canDeleteGoals,
    canManagePhoto,
    goals: ((goalsResult.data ?? []) as GoalRow[]).map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      isPrimary: goal.is_primary,
    })),
    messages,
    isFollowed: Boolean(followedResult.data && !followedResult.error),
    error: null,
  };
}
