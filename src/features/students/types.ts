import type { Tables } from '@/types/supabase';

export type TrafficLightStatus = NonNullable<
  Tables<'current_student_project_statuses'>['status']
>;

export type GoalStatus = Tables<'student_goals'>['status'];

export type StudentListItem = {
  id: string;
  fullName: string;
  initials: string;
  groupName: string | null;
  project: {
    title: string;
    status: TrafficLightStatus;
  } | null;
};

export type StudentListData = {
  query: string;
  students: StudentListItem[];
  error: string | null;
};

export type StudentContact = {
  labelKey: string;
  value: string;
};

export type StudentPerson = {
  id: string;
  profileId: string | null;
  fullName: string;
  isPrimary: boolean;
};

export type StudentGoal = {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  isPrimary: boolean;
};

export type StudentMessage = {
  id: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  tags: Tables<'student_messages'>['tags'];
  isImportant: boolean;
  createdAt: string;
};

export type StudentCardData = {
  student: {
    id: string;
    fullName: string;
    initials: string;
    photoUrl: string | null;
    groupName: string | null;
    groupLayer: string | null;
    updatedAt: string;
  } | null;
  contacts: StudentContact[];
  mentors: StudentPerson[];
  project: {
    id: string | null;
    title: string;
    status: TrafficLightStatus;
    statusSince: string | null;
    masters: StudentPerson[];
    canUpdateStatus: boolean;
  } | null;
  emotionalStatus: {
    status: TrafficLightStatus;
    statusSince: string | null;
  } | null;
  canUpdateEmotionalStatus: boolean;
  canManageGoals: boolean;
  canDeleteGoals: boolean;
  canManagePhoto: boolean;
  goals: StudentGoal[];
  messages: StudentMessage[];
  isFollowed: boolean;
  error: string | null;
};
