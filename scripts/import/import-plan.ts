import fs from 'fs';
import { randomUUID } from 'crypto';
import { parseCsv } from './validate-real-data';
import type { InMemoryImportPlan } from './import-types';

export function buildImportPlan(
  resolvedPaths: Record<string, string | null>,
  includeEmotionalBaseline: boolean
): InMemoryImportPlan {
  // 1. Manifest / School Year
  const manifestRows = parseCsv(fs.readFileSync(resolvedPaths.manifest!, 'utf8'));
  const [schoolYearName, startsOn, endsOn, , , importBatchId] = manifestRows[1];

  const schoolYearId = randomUUID();
  const plan: InMemoryImportPlan = {
    schoolYear: {
      name: schoolYearName,
      starts_on: startsOn,
      ends_on: endsOn,
      import_batch_id: importBatchId,
      generated_id: schoolYearId,
    },
    staffGrants: [],
    staffRoles: [],
    studentGroups: [],
    students: [],
    groupMentors: [],
    projects: [],
    studentMasters: [],
    studentGoals: [],
    emotionalBaselines: [],
  };

  // 2. Staff Grants
  const staffGrantsRows = parseCsv(fs.readFileSync(resolvedPaths.staffGrants!, 'utf8'));
  const emailToGrantIdMap = new Map<string, string>();
  for (let i = 1; i < staffGrantsRows.length; i++) {
    const row = staffGrantsRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [email, fullName, isActiveStr] = row;
    const lowerEmail = email.toLowerCase();
    const grantId = randomUUID();
    emailToGrantIdMap.set(lowerEmail, grantId);
    plan.staffGrants.push({
      email: lowerEmail,
      full_name: fullName,
      is_active: isActiveStr === 'true',
      generated_id: grantId,
    });
  }

  // 3. Staff Roles
  const staffRolesRows = parseCsv(fs.readFileSync(resolvedPaths.staffRoles!, 'utf8'));
  for (let i = 1; i < staffRolesRows.length; i++) {
    const row = staffRolesRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [email, role] = row;
    plan.staffRoles.push({
      email: email.toLowerCase(),
      role,
      generated_id: randomUUID(), // Composite linkage row
    });
  }

  // 4. Student Groups
  const groupRows = parseCsv(fs.readFileSync(resolvedPaths.studentGroups!, 'utf8'));
  const groupNameToIdMap = new Map<string, string>();
  for (let i = 1; i < groupRows.length; i++) {
    const row = groupRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [groupName, layer, isActiveStr] = row;
    const groupId = randomUUID();
    groupNameToIdMap.set(groupName, groupId);
    plan.studentGroups.push({
      name: groupName,
      layer,
      is_active: isActiveStr === 'true',
      generated_id: groupId,
    });
  }

  // 5. Students
  const studentRows = parseCsv(fs.readFileSync(resolvedPaths.students!, 'utf8'));
  const studentExtToUuidMap = new Map<string, string>();
  for (let i = 1; i < studentRows.length; i++) {
    const row = studentRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [
      studentId,
      firstName,
      lastName,
      groupName,
      primaryPhone,
      secondaryPhone,
      emergencyName,
      emergencyPhone,
      isActiveStr,
    ] = row;

    const studentUuid = randomUUID();
    studentExtToUuidMap.set(studentId, studentUuid);
    const groupId = groupNameToIdMap.get(groupName) || '';

    plan.students.push({
      external_student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      group_name: groupName,
      group_id: groupId,
      primary_phone: primaryPhone,
      secondary_phone: secondaryPhone,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      is_active: isActiveStr === 'true',
      generated_id: studentUuid,
    });
  }

  // 6. Group Mentors
  const mentorRows = parseCsv(fs.readFileSync(resolvedPaths.groupMentors!, 'utf8'));
  for (let i = 1; i < mentorRows.length; i++) {
    const row = mentorRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [groupName, email, isPrimaryStr, activeFrom, activeUntil] = row;
    const groupId = groupNameToIdMap.get(groupName) || '';
    plan.groupMentors.push({
      group_name: groupName,
      group_id: groupId,
      mentor_email: email.toLowerCase(),
      is_primary: isPrimaryStr === 'true',
      active_from: activeFrom,
      active_until: activeUntil,
      generated_id: randomUUID(),
    });
  }

  // 7. Projects
  const projectRows = parseCsv(fs.readFileSync(resolvedPaths.projects!, 'utf8'));
  const studentExtToProjectIdMap = new Map<string, string>();
  for (let i = 1; i < projectRows.length; i++) {
    const row = projectRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, title, description, status, isCurrentStr] = row;
    const studentUuid = studentExtToUuidMap.get(studentId) || '';
    const projectId = randomUUID();
    studentExtToProjectIdMap.set(studentId, projectId);

    plan.projects.push({
      external_student_id: studentId,
      student_id: studentUuid,
      project_title: title,
      description,
      status: status as 'green' | 'yellow' | 'red',
      is_current: isCurrentStr === 'true',
      generated_id: projectId,
    });
  }

  // 8. Student Masters
  const masterRows = parseCsv(fs.readFileSync(resolvedPaths.studentMasters!, 'utf8'));
  for (let i = 1; i < masterRows.length; i++) {
    const row = masterRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, email, isPrimaryStr, activeFrom, activeUntil] = row;
    const studentUuid = studentExtToUuidMap.get(studentId) || '';
    const projectId = studentExtToProjectIdMap.get(studentId) || '';

    plan.studentMasters.push({
      external_student_id: studentId,
      student_id: studentUuid,
      project_id: projectId,
      master_email: email.toLowerCase(),
      is_primary: isPrimaryStr === 'true',
      active_from: activeFrom,
      active_until: activeUntil,
      generated_id: randomUUID(),
    });
  }

  // 9. Student Goals
  const goalRows = parseCsv(fs.readFileSync(resolvedPaths.studentGoals!, 'utf8'));
  for (let i = 1; i < goalRows.length; i++) {
    const row = goalRows[i];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, title, description, status, isPrimaryStr] = row;
    const studentUuid = studentExtToUuidMap.get(studentId) || '';

    plan.studentGoals.push({
      external_student_id: studentId,
      student_id: studentUuid,
      goal_title: title,
      description,
      status: status as 'active' | 'completed' | 'paused' | 'archived',
      is_primary: isPrimaryStr === 'true',
      generated_id: randomUUID(),
    });
  }

  // 10. Optional Emotional Status Baseline
  if (includeEmotionalBaseline && resolvedPaths.emotionalBaseline) {
    const emoRows = parseCsv(fs.readFileSync(resolvedPaths.emotionalBaseline, 'utf8'));
    for (let i = 1; i < emoRows.length; i++) {
      const row = emoRows[i];
      if (row.length === 1 && row[0] === '') continue;
      const [studentId, status, note, createdAt] = row;
      const studentUuid = studentExtToUuidMap.get(studentId) || '';

      plan.emotionalBaselines.push({
        external_student_id: studentId,
        student_id: studentUuid,
        status: status as 'green' | 'yellow' | 'red',
        note,
        created_at: createdAt,
        generated_id: randomUUID(),
      });
    }
  }

  return plan;
}
