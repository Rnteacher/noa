export type GroupStateFilter = 'active' | 'inactive' | 'all';

export type AdminGroupMentor = {
  id: string;
  mentorId: string;
  mentorName: string;
  isPrimary: boolean;
  activeFrom: string;
  activeUntil: string | null;
};

export type AdminGroup = {
  id: string;
  name: string;
  layer: string | null;
  schoolYearId: string;
  schoolYearName: string;
  isActive: boolean;
  studentCount: number;
  mentors: AdminGroupMentor[];
  updatedAt: string;
};

export type AdminMentorOption = {
  id: string;
  fullName: string;
};

export type AdminGroupSchoolYearOption = {
  id: string;
  name: string;
};

/** Business expectation, not a DB constraint (schema intentionally allows exceptional states). */
export const EXPECTED_ACTIVE_MENTOR_COUNT = 2;
