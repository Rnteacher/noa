import fs from 'fs';
import path from 'path';

// Load environment variables from .env and .env.local
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      }
    }
  }
}

loadEnv();

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

// Helper to parse CSV rows supporting double-quotes escaping
function parseCsv(content: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let cell = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  return lines;
}

function findFile(dir: string, baseNames: string[]): string | null {
  const filesInDir = fs.readdirSync(dir);
  for (const file of filesInDir) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.csv') continue;
    const nameWithoutExt = path.basename(file, ext).toLowerCase();
    for (const base of baseNames) {
      if (
        nameWithoutExt === base.toLowerCase() ||
        nameWithoutExt === `${base}_template`.toLowerCase() ||
        nameWithoutExt === `${base}_example`.toLowerCase()
      ) {
        return path.join(dir, file);
      }
    }
  }
  return null;
}

interface ValidationContext {
  errors: string[];
  warnings: string[];
  staffEmails: Set<string>;
  groupNames: Set<string>;
  studentIds: Set<string>;
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

function checkHeaders(filename: string, parsed: string[][], expectedHeaders: string[], ctx: ValidationContext): boolean {
  if (parsed.length === 0) {
    ctx.errors.push(`${filename}: File is empty.`);
    return false;
  }
  const headers = parsed[0];
  if (headers.length !== expectedHeaders.length) {
    ctx.errors.push(`${filename}: Header column count mismatch. Expected ${expectedHeaders.length}, got ${headers.length}.`);
    return false;
  }
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      ctx.errors.push(`${filename}: Header mismatch at column ${i + 1}. Expected '${expectedHeaders[i]}', got '${headers[i]}'.`);
      return false;
    }
  }
  return true;
}

function validateManifest(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['school_year_name', 'starts_on', 'ends_on', 'data_owner_email', 'operator_email', 'import_batch_id'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  if (rows.length < 2) {
    ctx.errors.push(`${path.basename(filePath)}: No manifest row present.`);
    return;
  }

  const [schoolYear, startsOn, endsOn, ownerEmail, opEmail, batchId] = rows[1];

  if (!schoolYear) ctx.errors.push(`${path.basename(filePath)}: school_year_name must not be empty.`);
  if (!isDateString(startsOn)) ctx.errors.push(`${path.basename(filePath)}: starts_on must be a valid YYYY-MM-DD date.`);
  if (!isDateString(endsOn)) ctx.errors.push(`${path.basename(filePath)}: ends_on must be a valid YYYY-MM-DD date.`);
  if (isDateString(startsOn) && isDateString(endsOn) && new Date(startsOn) > new Date(endsOn)) {
    ctx.errors.push(`${path.basename(filePath)}: starts_on cannot be after ends_on.`);
  }
  if (!isEmail(ownerEmail)) ctx.errors.push(`${path.basename(filePath)}: data_owner_email is invalid.`);
  if (!isEmail(opEmail)) ctx.errors.push(`${path.basename(filePath)}: operator_email is invalid.`);
  if (!batchId) ctx.errors.push(`${path.basename(filePath)}: import_batch_id must not be empty.`);

  const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
  if (allowedDomain) {
    const domain = allowedDomain.trim().toLowerCase();
    if (isEmail(ownerEmail) && !ownerEmail.toLowerCase().endsWith(`@${domain}`)) {
      ctx.warnings.push(`${path.basename(filePath)}: data_owner_email domain does not match allowed domain ${domain}.`);
    }
    if (isEmail(opEmail) && !opEmail.toLowerCase().endsWith(`@${domain}`)) {
      ctx.warnings.push(`${path.basename(filePath)}: operator_email domain does not match allowed domain ${domain}.`);
    }
  }
}

function validateStaffGrants(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['email', 'full_name', 'is_active'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN?.trim().toLowerCase();

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [email, fullName, isActive] = row;
    const rowNum = idx + 1;

    if (!isEmail(email)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' is invalid.`);
      continue;
    }

    if (email !== email.toLowerCase()) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' must be lowercase.`);
    }

    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' domain does not match allowed domain ${allowedDomain}.`);
    }

    if (!fullName) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: full_name must not be empty.`);
    }

    if (isActive !== 'true' && isActive !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_active must be 'true' or 'false'.`);
    }

    ctx.staffEmails.add(email.toLowerCase());
  }
}

function validateStaffRoles(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['email', 'role'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [email, role] = row;
    const rowNum = idx + 1;

    const lowerEmail = email.toLowerCase();
    if (!ctx.staffEmails.has(lowerEmail)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
    }

    if (!APP_ROLES.includes(role)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Role '${role}' is not in valid roles: ${APP_ROLES.join(', ')}.`);
    }
  }
}

function validateStudentGroups(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['group_name', 'layer', 'is_active'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [groupName, , isActive] = row;
    const rowNum = idx + 1;

    if (!groupName) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: group_name must not be empty.`);
      continue;
    }

    if (ctx.groupNames.has(groupName)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Duplicate group name '${groupName}'.`);
    }

    if (isActive !== 'true' && isActive !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_active must be 'true' or 'false'.`);
    }

    ctx.groupNames.add(groupName);
  }
}

function validateStudents(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
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
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
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

    if (!studentId) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: external_student_id must not be empty.`);
      continue;
    }

    if (ctx.studentIds.has(studentId)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Duplicate external_student_id '${studentId}'.`);
    }

    if (!firstName || !lastName) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: first_name and last_name must not be empty.`);
    }

    if (!ctx.groupNames.has(groupName)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Group '${groupName}' does not exist in student groups.`);
    }

    if (!isPhoneString(primaryPhone)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: primary_phone '${primaryPhone}' format is invalid.`);
    }

    if (secondaryPhone && !isPhoneString(secondaryPhone)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: secondary_phone '${secondaryPhone}' format is invalid.`);
    }

    if (emergencyPhone && !isPhoneString(emergencyPhone)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: emergency_contact_phone '${emergencyPhone}' format is invalid.`);
    }

    if (isActive !== 'true' && isActive !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_active must be 'true' or 'false'.`);
    }

    ctx.studentIds.add(studentId);
  }
}

function validateGroupMentors(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['group_name', 'mentor_email', 'is_primary', 'active_from', 'active_until'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [groupName, email, isPrimary, activeFrom, activeUntil] = row;
    const rowNum = idx + 1;

    if (!ctx.groupNames.has(groupName)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Group '${groupName}' does not exist in student groups.`);
    }

    if (!ctx.staffEmails.has(email.toLowerCase())) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
    }

    if (isPrimary !== 'true' && isPrimary !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
    }

    if (!isDateString(activeFrom)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: active_from must be a valid YYYY-MM-DD date.`);
    }

    if (activeUntil && !isDateString(activeUntil)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: active_until must be a valid YYYY-MM-DD date.`);
    }
  }
}

function validateProjects(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['external_student_id', 'project_title', 'description', 'status', 'is_current'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  const currentProjectCounts = new Map<string, number>();

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, title, , status, isCurrent] = row;
    const rowNum = idx + 1;

    if (!ctx.studentIds.has(studentId)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
    }

    if (!title) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: project_title must not be empty.`);
    }

    if (!PROJECT_STATUSES.includes(status)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${PROJECT_STATUSES.join(', ')}.`);
    }

    if (isCurrent !== 'true' && isCurrent !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_current must be 'true' or 'false'.`);
    }

    if (isCurrent === 'true') {
      const count = currentProjectCounts.get(studentId) || 0;
      currentProjectCounts.set(studentId, count + 1);
    }
  }

  for (const [studentId, count] of currentProjectCounts.entries()) {
    if (count > 1) {
      ctx.errors.push(`${path.basename(filePath)}: Student '${studentId}' has ${count} projects marked as current. Maximum is 1.`);
    }
  }
}

function validateStudentMasters(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['external_student_id', 'master_email', 'is_primary', 'active_from', 'active_until'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, email, isPrimary, activeFrom, activeUntil] = row;
    const rowNum = idx + 1;

    if (!ctx.studentIds.has(studentId)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
    }

    if (!ctx.staffEmails.has(email.toLowerCase())) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Email '${email}' does not exist in staff access grants.`);
    }

    if (isPrimary !== 'true' && isPrimary !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
    }

    if (!isDateString(activeFrom)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: active_from must be a valid YYYY-MM-DD date.`);
    }

    if (activeUntil && !isDateString(activeUntil)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: active_until must be a valid YYYY-MM-DD date.`);
    }
  }
}

function validateStudentGoals(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['external_student_id', 'goal_title', 'description', 'status', 'is_primary'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  const primaryGoalCounts = new Map<string, number>();

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, title, , status, isPrimary] = row;
    const rowNum = idx + 1;

    if (!ctx.studentIds.has(studentId)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
    }

    if (!title) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: goal_title must not be empty.`);
    }

    if (!GOAL_STATUSES.includes(status)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${GOAL_STATUSES.join(', ')}.`);
    }

    if (isPrimary !== 'true' && isPrimary !== 'false') {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: is_primary must be 'true' or 'false'.`);
    }

    if (isPrimary === 'true') {
      const count = primaryGoalCounts.get(studentId) || 0;
      primaryGoalCounts.set(studentId, count + 1);
    }
  }

  for (const [studentId, count] of primaryGoalCounts.entries()) {
    if (count > 1) {
      ctx.errors.push(`${path.basename(filePath)}: Student '${studentId}' has ${count} goals marked as primary. Maximum is 1.`);
    }
  }
}

function validateEmotionalBaseline(filePath: string, ctx: ValidationContext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  const headers = ['external_student_id', 'status', 'note', 'created_at'];
  if (!checkHeaders(path.basename(filePath), rows, headers, ctx)) return;

  for (let idx = 1; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length === 1 && row[0] === '') continue;
    const [studentId, status, , createdAt] = row;
    const rowNum = idx + 1;

    if (!ctx.studentIds.has(studentId)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Student ID '${studentId}' does not exist in students roster.`);
    }

    if (!PROJECT_STATUSES.includes(status)) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: Status '${status}' is invalid. Allowed: ${PROJECT_STATUSES.join(', ')}.`);
    }

    if (!createdAt || isNaN(Date.parse(createdAt))) {
      ctx.errors.push(`${path.basename(filePath)}: Row ${rowNum}: created_at must be a valid ISO Date timestamp.`);
    }
  }
}

function validateDirectory(dirPath: string) {
  console.log(`Starting CSV import validation in directory: ${dirPath}`);

  if (!fs.existsSync(dirPath)) {
    console.error(`[ERROR] Target directory '${dirPath}' does not exist.`);
    process.exit(1);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    console.error(`[ERROR] Target path '${dirPath}' is not a directory.`);
    process.exit(1);
  }

  const ctx: ValidationContext = {
    errors: [],
    warnings: [],
    staffEmails: new Set(),
    groupNames: new Set(),
    studentIds: new Set(),
  };

  const filesMap = {
    manifest: ['import_manifest'],
    staffGrants: ['staff_access_grants'],
    staffRoles: ['staff_roles'],
    studentGroups: ['student_groups'],
    students: ['students'],
    groupMentors: ['group_mentors'],
    projects: ['projects'],
    studentMasters: ['student_masters'],
    studentGoals: ['student_goals'],
    emotionalBaseline: ['student_emotional_status_baseline'],
  };

  const resolvedPaths: Record<string, string | null> = {};
  for (const [key, bases] of Object.entries(filesMap)) {
    resolvedPaths[key] = findFile(dirPath, bases);
  }

  // Mandatory files check
  const mandatoryKeys: (keyof typeof filesMap)[] = [
    'manifest',
    'staffGrants',
    'staffRoles',
    'studentGroups',
    'students',
    'groupMentors',
    'projects',
    'studentMasters',
    'studentGoals',
  ];

  for (const key of mandatoryKeys) {
    if (!resolvedPaths[key]) {
      ctx.errors.push(`Missing required file matching keywords: ${filesMap[key].join(', ')}`);
    }
  }

  // Run validation step by step if files exist
  if (resolvedPaths.manifest) {
    console.log(`[INFO] Validating manifest: ${path.basename(resolvedPaths.manifest)}`);
    validateManifest(resolvedPaths.manifest, ctx);
  }

  if (resolvedPaths.staffGrants) {
    console.log(`[INFO] Validating staff access grants: ${path.basename(resolvedPaths.staffGrants)}`);
    validateStaffGrants(resolvedPaths.staffGrants, ctx);
  }

  if (resolvedPaths.staffRoles && resolvedPaths.staffGrants) {
    console.log(`[INFO] Validating staff roles: ${path.basename(resolvedPaths.staffRoles)}`);
    validateStaffRoles(resolvedPaths.staffRoles, ctx);
  }

  if (resolvedPaths.studentGroups) {
    console.log(`[INFO] Validating student groups: ${path.basename(resolvedPaths.studentGroups)}`);
    validateStudentGroups(resolvedPaths.studentGroups, ctx);
  }

  if (resolvedPaths.students && resolvedPaths.studentGroups) {
    console.log(`[INFO] Validating student roster: ${path.basename(resolvedPaths.students)}`);
    validateStudents(resolvedPaths.students, ctx);
  }

  if (resolvedPaths.groupMentors && resolvedPaths.studentGroups && resolvedPaths.staffGrants) {
    console.log(`[INFO] Validating group mentors: ${path.basename(resolvedPaths.groupMentors)}`);
    validateGroupMentors(resolvedPaths.groupMentors, ctx);
  }

  if (resolvedPaths.projects && resolvedPaths.students) {
    console.log(`[INFO] Validating projects: ${path.basename(resolvedPaths.projects)}`);
    validateProjects(resolvedPaths.projects, ctx);
  }

  if (resolvedPaths.studentMasters && resolvedPaths.students && resolvedPaths.staffGrants) {
    console.log(`[INFO] Validating student masters: ${path.basename(resolvedPaths.studentMasters)}`);
    validateStudentMasters(resolvedPaths.studentMasters, ctx);
  }

  if (resolvedPaths.studentGoals && resolvedPaths.students) {
    console.log(`[INFO] Validating student goals: ${path.basename(resolvedPaths.studentGoals)}`);
    validateStudentGoals(resolvedPaths.studentGoals, ctx);
  }

  if (resolvedPaths.emotionalBaseline) {
    if (resolvedPaths.students) {
      console.log(`[INFO] Validating emotional status baseline: ${path.basename(resolvedPaths.emotionalBaseline)}`);
      validateEmotionalBaseline(resolvedPaths.emotionalBaseline, ctx);
    }
  } else {
    ctx.warnings.push(`Optional emotional baseline file not found. Baseline sync will be skipped.`);
  }

  console.log('\n--- Validation Summary ---');
  if (ctx.warnings.length > 0) {
    console.log(`\nWarnings (${ctx.warnings.length}):`);
    ctx.warnings.forEach((warn) => console.log(`[WARN] ${warn}`));
  }

  if (ctx.errors.length > 0) {
    console.log(`\nErrors (${ctx.errors.length}):`);
    ctx.errors.forEach((err) => console.log(`[ERR] ${err}`));
    console.log('\n[FAIL] Validation failed. Please fix the errors listed above.');
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] All files parsed and matched successfully! Ready for dry-run ingestion.');
    process.exit(0);
  }
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('[ERROR] Please specify the target directory path. Usage: npm run validate:import -- <directory-path>');
  process.exit(1);
}

validateDirectory(path.resolve(process.cwd(), targetDir));
