export interface SchoolYearRecord {
  school_year_name: string;
  starts_on: string;
  ends_on: string;
  data_owner_email: string;
  operator_email: string;
  import_batch_id: string;
}

export interface StaffGrantRecord {
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface StaffRoleRecord {
  email: string;
  role: string;
}

export interface StudentGroupRecord {
  group_name: string;
  layer: string;
  is_active: boolean;
}

export interface StudentRecord {
  external_student_id: string;
  first_name: string;
  last_name: string;
  group_name: string;
  primary_phone: string;
  secondary_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  is_active: boolean;
}

export interface GroupMentorRecord {
  group_name: string;
  mentor_email: string;
  is_primary: boolean;
  active_from: string;
  active_until: string;
}

export interface ProjectRecord {
  external_student_id: string;
  project_title: string;
  description: string;
  status: 'green' | 'yellow' | 'red';
  is_current: boolean;
}

export interface StudentMasterRecord {
  external_student_id: string;
  master_email: string;
  is_primary: boolean;
  active_from: string;
  active_until: string;
}

export interface StudentGoalRecord {
  external_student_id: string;
  goal_title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  is_primary: boolean;
}

export interface EmotionalBaselineRecord {
  external_student_id: string;
  status: 'green' | 'yellow' | 'red';
  note: string;
  created_at: string;
}

export interface InMemoryImportPlan {
  schoolYear: {
    name: string;
    starts_on: string;
    ends_on: string;
    import_batch_id: string;
    generated_id: string;
  };
  staffGrants: Array<{
    email: string;
    full_name: string;
    is_active: boolean;
    generated_id: string;
  }>;
  staffRoles: Array<{
    email: string;
    role: string;
    generated_id: string; // Composite key role resolution
  }>;
  studentGroups: Array<{
    name: string;
    layer: string;
    is_active: boolean;
    generated_id: string;
  }>;
  students: Array<{
    external_student_id: string;
    first_name: string;
    last_name: string;
    group_name: string;
    group_id: string; // Resolved group uuid
    primary_phone: string;
    secondary_phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    is_active: boolean;
    generated_id: string;
  }>;
  groupMentors: Array<{
    group_name: string;
    group_id: string;
    mentor_email: string;
    is_primary: boolean;
    active_from: string;
    active_until: string;
    generated_id: string;
  }>;
  projects: Array<{
    external_student_id: string;
    student_id: string; // Resolved student uuid
    project_title: string;
    description: string;
    status: 'green' | 'yellow' | 'red';
    is_current: boolean;
    generated_id: string;
  }>;
  studentMasters: Array<{
    external_student_id: string;
    student_id: string;
    project_id: string; // Resolved project uuid
    master_email: string;
    is_primary: boolean;
    active_from: string;
    active_until: string;
    generated_id: string;
  }>;
  studentGoals: Array<{
    external_student_id: string;
    student_id: string;
    goal_title: string;
    description: string;
    status: 'active' | 'completed' | 'paused' | 'archived';
    is_primary: boolean;
    generated_id: string;
  }>;
  emotionalBaselines: Array<{
    external_student_id: string;
    student_id: string;
    status: 'green' | 'yellow' | 'red';
    note: string;
    created_at: string;
    generated_id: string;
  }>;
}

export interface ImportRunManifest {
  import_batch_id: string;
  timestamp: string;
  mode: 'dry-run' | 'plan-only' | 'apply-local';
  input_folder_path: string;
  generated_ids: Record<string, string[]>;
  external_student_id_to_uuid: Record<string, string>;
  counts: Record<string, number>;
  warnings: string[];
  rollback_eligible: boolean;
}
