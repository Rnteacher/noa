'use server';

import { parseCsv } from './csv';

const APP_ROLES = [
  'staff',
  'mentor',
  'master',
  'counselor',
  'leadership',
  'manager',
  'super_admin',
];

const PROJECT_STATUSES = ['green', 'yellow', 'red'];
const GOAL_STATUSES = ['active', 'completed', 'paused', 'archived'];

export interface ValidationReport {
  success: boolean;
  errors: string[];
  warnings: string[];
  counts: {
    staffGrants: number;
    staffRoles: number;
    studentGroups: number;
    students: number;
    groupMentors: number;
    projects: number;
    studentMasters: number;
    studentGoals: number;
    emotionalBaselines: number;
  };
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

function isPhoneString(phoneStr: string): boolean {
  if (phoneStr === '') return true;
  return /^\+?[\d\s\-()]{7,20}$/.test(phoneStr);
}

function checkHeaders(filename: string, parsed: string[][], expectedHeaders: string[], errors: string[]): boolean {
  if (parsed.length === 0) {
    errors.push(`${filename}: File is empty.`);
    return false;
  }
  const headers = parsed[0].map((h) => h.trim().toLowerCase());
  if (headers.length !== expectedHeaders.length) {
    errors.push(`${filename}: Header column count mismatch. Expected ${expectedHeaders.length}, got ${headers.length}.`);
    return false;
  }
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i].toLowerCase()) {
      errors.push(`${filename}: Header mismatch at column ${i + 1}. Expected '${expectedHeaders[i]}', got '${headers[i]}'.`);
      return false;
    }
  }
  return true;
}

export async function validateRosterAction(
  files: Record<string, string>
): Promise<ValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = {
    staffGrants: 0,
    staffRoles: 0,
    studentGroups: 0,
    students: 0,
    groupMentors: 0,
    projects: 0,
    studentMasters: 0,
    studentGoals: 0,
    emotionalBaselines: 0,
  };

  const staffEmails = new Set<string>();
  const groupNames = new Set<string>();
  const studentIds = new Set<string>();

  const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN?.trim().toLowerCase();

  // 1. Validate Manifest if provided
  if (files.manifest) {
    const rows = parseCsv(files.manifest);
    const headers = ['school_year_name', 'starts_on', 'ends_on', 'data_owner_email', 'operator_email', 'import_batch_id'];
    if (checkHeaders('manifest.csv', rows, headers, errors)) {
      if (rows.length < 2) {
        errors.push('manifest.csv: No manifest row present.');
      } else {
        const [schoolYear, startsOn, endsOn, ownerEmail, opEmail, batchId] = rows[1];
        if (!schoolYear) errors.push('manifest.csv: school_year_name must not be empty.');
        if (!isDateString(startsOn)) errors.push('manifest.csv: starts_on must be a valid YYYY-MM-DD date.');
        if (!isDateString(endsOn)) errors.push('manifest.csv: ends_on must be a valid YYYY-MM-DD date.');
        if (isDateString(startsOn) && isDateString(endsOn) && new Date(startsOn) > new Date(endsOn)) {
          errors.push('manifest.csv: starts_on cannot be after ends_on.');
        }
        if (!isEmail(ownerEmail)) errors.push('manifest.csv: data_owner_email is invalid.');
        if (!isEmail(opEmail)) errors.push('manifest.csv: operator_email is invalid.');
        if (!batchId) errors.push('manifest.csv: import_batch_id must not be empty.');

        if (allowedDomain) {
          if (isEmail(ownerEmail) && !ownerEmail.toLowerCase().endsWith(`@${allowedDomain}`)) {
            warnings.push(`manifest.csv: data_owner_email domain does not match allowed domain ${allowedDomain}.`);
          }
          if (isEmail(opEmail) && !opEmail.toLowerCase().endsWith(`@${allowedDomain}`)) {
            warnings.push(`manifest.csv: operator_email domain does not match allowed domain ${allowedDomain}.`);
          }
        }
      }
    }
  } else {
    warnings.push('Import manifest is missing. Local validation is performing checklist constraints only.');
  }

  // 2. Validate Staff Access Grants
  if (files.staffGrants) {
    const rows = parseCsv(files.staffGrants);
    const headers = ['email', 'full_name', 'is_active'];
    if (checkHeaders('staff_access_grants.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [email, fullName, isActive] = row;
        const rowNum = idx + 1;
        counts.staffGrants++;

        if (!email || !isEmail(email)) {
          errors.push(`staff_access_grants.csv: Row ${rowNum}: Email '${email}' is invalid.`);
          continue;
        }

        if (email !== email.toLowerCase()) {
          errors.push(`staff_access_grants.csv: Row ${rowNum}: Email '${email}' must be lowercase.`);
        }

        if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
          errors.push(`staff_access_grants.csv: Row ${rowNum}: Email '${email}' domain does not match allowed domain ${allowedDomain}.`);
        }

        if (!fullName) {
          errors.push(`staff_access_grants.csv: Row ${rowNum}: full_name must not be empty.`);
        }

        if (isActive !== 'true' && isActive !== 'false') {
          errors.push(`staff_access_grants.csv: Row ${rowNum}: is_active must be 'true' or 'false'.`);
        }

        staffEmails.add(email.toLowerCase());
      }
    }
  }

  // 3. Validate Staff Roles
  if (files.staffRoles) {
    const rows = parseCsv(files.staffRoles);
    const headers = ['email', 'role'];
    if (checkHeaders('staff_roles.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [email, role] = row;
        const rowNum = idx + 1;
        counts.staffRoles++;

        const lowerEmail = email ? email.toLowerCase() : '';
        if (files.staffGrants && !staffEmails.has(lowerEmail)) {
          errors.push(`staff_roles.csv: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
        }

        if (!APP_ROLES.includes(role)) {
          errors.push(`staff_roles.csv: Row ${rowNum}: Role '${role}' is not in valid roles: ${APP_ROLES.join(', ')}.`);
        }
      }
    }
  }

  // 4. Validate Student Groups
  if (files.studentGroups) {
    const rows = parseCsv(files.studentGroups);
    const headers = ['group_name', 'layer', 'is_active'];
    if (checkHeaders('student_groups.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [groupName, , isActive] = row;
        const rowNum = idx + 1;
        counts.studentGroups++;

        if (!groupName) {
          errors.push(`student_groups.csv: Row ${rowNum}: group_name must not be empty.`);
          continue;
        }

        if (groupNames.has(groupName)) {
          errors.push(`student_groups.csv: Row ${rowNum}: Duplicate group name '${groupName}'.`);
        }

        if (isActive !== 'true' && isActive !== 'false') {
          errors.push(`student_groups.csv: Row ${rowNum}: is_active must be 'true' or 'false'.`);
        }

        groupNames.add(groupName);
      }
    }
  }

  // 5. Validate Students
  if (files.students) {
    const rows = parseCsv(files.students);
    const headers = [
      'external_student_id',
      'first_name',
      'last_name',
      'group_name',
      'primary_phone',
      'secondary_phone',
      'emergency_contact_name',
      'emergency_contact_phone',
      'is_active',
    ];
    if (checkHeaders('students.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [
          studentId,
          firstName,
          lastName,
          groupName,
          primaryPhone,
          secondaryPhone,
          ,
          emergencyPhone,
          isActive,
        ] = row;
        const rowNum = idx + 1;
        counts.students++;

        if (!studentId) {
          errors.push(`students.csv: Row ${rowNum}: external_student_id must not be empty.`);
          continue;
        }

        if (studentIds.has(studentId)) {
          errors.push(`students.csv: Row ${rowNum}: Duplicate external_student_id '${studentId}'.`);
        }

        if (!firstName || !lastName) {
          errors.push(`students.csv: Row ${rowNum}: first_name and last_name must not be empty.`);
        }

        if (files.studentGroups && !groupNames.has(groupName)) {
          errors.push(`students.csv: Row ${rowNum}: Group '${groupName}' does not exist in student groups.`);
        }

        if (!isPhoneString(primaryPhone)) {
          errors.push(`students.csv: Row ${rowNum}: primary_phone '${primaryPhone}' format is invalid.`);
        }

        if (secondaryPhone && !isPhoneString(secondaryPhone)) {
          errors.push(`students.csv: Row ${rowNum}: secondary_phone '${secondaryPhone}' format is invalid.`);
        }

        if (emergencyPhone && !isPhoneString(emergencyPhone)) {
          errors.push(`students.csv: Row ${rowNum}: emergency_contact_phone '${emergencyPhone}' format is invalid.`);
        }

        if (isActive !== 'true' && isActive !== 'false') {
          errors.push(`students.csv: Row ${rowNum}: is_active must be 'true' or 'false'.`);
        }

        studentIds.add(studentId);
      }
    }
  }

  // 6. Validate Group Mentors
  if (files.groupMentors) {
    const rows = parseCsv(files.groupMentors);
    const headers = ['group_name', 'mentor_email', 'is_primary', 'active_from', 'active_until'];
    if (checkHeaders('group_mentors.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [groupName, email, isPrimary, activeFrom, activeUntil] = row;
        const rowNum = idx + 1;
        counts.groupMentors++;

        if (files.studentGroups && !groupNames.has(groupName)) {
          errors.push(`group_mentors.csv: Row ${rowNum}: Group '${groupName}' does not exist in student groups.`);
        }

        if (email && files.staffGrants && !staffEmails.has(email.toLowerCase())) {
          errors.push(`group_mentors.csv: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
        }

        if (isPrimary !== 'true' && isPrimary !== 'false') {
          errors.push(`group_mentors.csv: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
        }

        if (!isDateString(activeFrom)) {
          errors.push(`group_mentors.csv: Row ${rowNum}: active_from must be a valid YYYY-MM-DD date.`);
        }

        if (activeUntil && !isDateString(activeUntil)) {
          errors.push(`group_mentors.csv: Row ${rowNum}: active_until must be a valid YYYY-MM-DD date.`);
        }
      }
    }
  }

  // 7. Validate Projects
  if (files.projects) {
    const rows = parseCsv(files.projects);
    const headers = ['external_student_id', 'project_title', 'description', 'status', 'is_current'];
    if (checkHeaders('projects.csv', rows, headers, errors)) {
      const currentProjectCounts = new Map<string, number>();

      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [studentId, title, , status, isCurrent] = row;
        const rowNum = idx + 1;
        counts.projects++;

        if (files.students && !studentIds.has(studentId)) {
          errors.push(`projects.csv: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
        }

        if (!title) {
          errors.push(`projects.csv: Row ${rowNum}: project_title must not be empty.`);
        }

        if (!PROJECT_STATUSES.includes(status)) {
          errors.push(`projects.csv: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${PROJECT_STATUSES.join(', ')}.`);
        }

        if (isCurrent !== 'true' && isCurrent !== 'false') {
          errors.push(`projects.csv: Row ${rowNum}: is_current must be 'true' or 'false'.`);
        }

        if (isCurrent === 'true') {
          const count = currentProjectCounts.get(studentId) || 0;
          currentProjectCounts.set(studentId, count + 1);
        }
      }

      for (const [studentId, count] of currentProjectCounts.entries()) {
        if (count > 1) {
          errors.push(`projects.csv: Student '${studentId}' has ${count} projects marked as current. Maximum is 1.`);
        }
      }
    }
  }

  // 8. Validate Student Masters
  if (files.studentMasters) {
    const rows = parseCsv(files.studentMasters);
    const headers = ['external_student_id', 'master_email', 'is_primary', 'active_from', 'active_until'];
    if (checkHeaders('student_masters.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [studentId, email, isPrimary, activeFrom, activeUntil] = row;
        const rowNum = idx + 1;
        counts.studentMasters++;

        if (files.students && !studentIds.has(studentId)) {
          errors.push(`student_masters.csv: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
        }

        if (email && files.staffGrants && !staffEmails.has(email.toLowerCase())) {
          errors.push(`student_masters.csv: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
        }

        if (isPrimary !== 'true' && isPrimary !== 'false') {
          errors.push(`student_masters.csv: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
        }

        if (!isDateString(activeFrom)) {
          errors.push(`student_masters.csv: Row ${rowNum}: active_from must be a valid YYYY-MM-DD date.`);
        }

        if (activeUntil && !isDateString(activeUntil)) {
          errors.push(`student_masters.csv: Row ${rowNum}: active_until must be a valid YYYY-MM-DD date.`);
        }
      }
    }
  }

  // 9. Validate Student Goals
  if (files.studentGoals) {
    const rows = parseCsv(files.studentGoals);
    const headers = ['external_student_id', 'goal_title', 'description', 'status', 'is_primary'];
    if (checkHeaders('student_goals.csv', rows, headers, errors)) {
      const primaryGoalCounts = new Map<string, number>();

      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [studentId, title, , status, isPrimary] = row;
        const rowNum = idx + 1;
        counts.studentGoals++;

        if (files.students && !studentIds.has(studentId)) {
          errors.push(`student_goals.csv: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
        }

        if (!title) {
          errors.push(`student_goals.csv: Row ${rowNum}: goal_title must not be empty.`);
        }

        if (!GOAL_STATUSES.includes(status)) {
          errors.push(`student_goals.csv: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${GOAL_STATUSES.join(', ')}.`);
        }

        if (isPrimary !== 'true' && isPrimary !== 'false') {
          errors.push(`student_goals.csv: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
        }

        if (isPrimary === 'true') {
          const count = primaryGoalCounts.get(studentId) || 0;
          primaryGoalCounts.set(studentId, count + 1);
        }
      }

      for (const [studentId, count] of primaryGoalCounts.entries()) {
        if (count > 1) {
          errors.push(`student_goals.csv: Student '${studentId}' has ${count} goals marked as primary. Maximum is 1.`);
        }
      }
    }
  }

  // 10. Validate Emotional Baseline
  if (files.emotionalBaseline) {
    const rows = parseCsv(files.emotionalBaseline);
    const headers = ['external_student_id', 'status', 'note', 'created_at'];
    if (checkHeaders('student_emotional_status_baseline.csv', rows, headers, errors)) {
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
        const [studentId, status, , createdAt] = row;
        const rowNum = idx + 1;
        counts.emotionalBaselines++;

        if (files.students && !studentIds.has(studentId)) {
          errors.push(`student_emotional_status_baseline.csv: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
        }

        if (!PROJECT_STATUSES.includes(status)) {
          errors.push(`student_emotional_status_baseline.csv: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${PROJECT_STATUSES.join(', ')}.`);
        }

        if (!createdAt || isNaN(Date.parse(createdAt))) {
          errors.push(`student_emotional_status_baseline.csv: Row ${rowNum}: created_at must be a valid ISO Date timestamp.`);
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    counts,
  };
}
