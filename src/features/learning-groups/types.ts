import type { Enums } from '@/types/supabase';

export type LearningGroupWeekday = Enums<'weekday'>;

export const LEARNING_GROUP_WEEKDAYS: LearningGroupWeekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export type LearningGroupStateFilter = 'active' | 'inactive' | 'all';

export type AdminLearningGroupOption = {
  id: string;
  name: string;
};

export type AdminLearningGroupLeaderOption = {
  id: string;
  fullName: string;
};

export type AdminLearningGroup = {
  id: string;
  title: string;
  description: string | null;
  weekday: LearningGroupWeekday;
  startsAt: string;
  endsAt: string;
  leaderId: string | null;
  leaderName: string | null;
  room: string | null;
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
  targetGroupIds: string[];
  targetGroupNames: string[];
  updatedAt: string;
};
