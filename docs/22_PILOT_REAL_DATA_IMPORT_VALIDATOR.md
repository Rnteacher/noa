# 22 - Pilot Real-Data Import Validator v1

## 1. Executive Summary
This document logs the implementation and verification of the local TypeScript CLI import validator (`scripts/import/validate-real-data.ts`). 

The validator allows technical operators to verify populated CSV datasets locally against schema constraints, allowed domains, unique constraints, and foreign key relations before executing any database scripts.

---

## 2. Validation Architecture & Logic

### A. Environment Loading
- The script loads environment configurations from `.env.local` and `.env` to fetch `GOOGLE_ALLOWED_DOMAIN` for email domain validation.

### B. Dependency-Free Parsing
- Implements a custom CSV parsing function supporting standard RFC 4180 double-quote escapes, allowing commas and quotes inside field descriptions.

### C. File Resolution
- Dynamically resolves filenames inside the target directory (supporting base names, template suffixes, or example suffixes, e.g. `students.csv` or `students_template.csv`).

### D. Relational Consistency Checks
- **Mandatory Files**: Asserts all 9 required datasets exist.
- **Roster Alignment**: Verifies that any student ID referenced in project, master, or goal files exists in the main student roster.
- **Staff Verification**: Verifies that any mentor or master email exists in the whitelisted staff grants list.
- **Constraint Caps**: Asserts that no student has more than one active current project or primary learning goal.
- **Allowed Enums**: Validates roles, traffic lights, and goal statuses against database-level domains.

---

## 3. Verification Log

### A. Example Directory Validation (Passed)
We executed the validator CLI against the mock data reference examples in the repository:

```bash
npm run validate:import -- docs/import/examples
```

**CLI Output Log:**
```text
> chamama-staff-app@0.1.0 validate:import
> npx tsx scripts/import/validate-real-data.ts docs/import/examples

Starting CSV import validation in directory: D:\Projects\staff-app\docs\import\examples
[INFO] Validating manifest: import_manifest_example.csv
[INFO] Validating staff access grants: staff_access_grants_example.csv
[INFO] Validating staff roles: staff_roles_example.csv
[INFO] Validating student groups: student_groups_example.csv
[INFO] Validating student roster: students_example.csv
[INFO] Validating group mentors: group_mentors_example.csv
[INFO] Validating projects: projects_example.csv
[INFO] Validating student masters: student_masters_example.csv
[INFO] Validating student goals: student_goals_example.csv
[INFO] Validating emotional status baseline: student_emotional_status_baseline_example.csv

--- Validation Summary ---

[SUCCESS] All files parsed and matched successfully! Ready for dry-run ingestion.
```
The script completed successfully with exit code `0`.

### B. Template Directory Validation (Header-Only Behavior)
We executed the validator against the blank templates directory:

```bash
npm run validate:import -- docs/import/templates
```

**CLI Output Log:**
```text
Starting CSV import validation in directory: D:\Projects\staff-app\docs\import\templates
[INFO] Validating manifest: import_manifest_template.csv
...
--- Validation Summary ---

Errors (1):
[ERR] import_manifest_template.csv: No manifest row present.

[FAIL] Validation failed. Please fix the errors listed above.
```

**Documented Behavior**: The manifest requires at least 1 record to establish metadata, so running on empty templates fails with `No manifest row present`. All other files (grants, roles, students, etc.) pass with zero rows because rosters and assignments can legitimately be empty.

### C. Temporary Invalidation Tests (Temp OS Directory)
We verified the validator catches invalid data using a scratch test runner script, writing temporary mutated CSV configurations to the OS temp folder (`C:\Users\ronen\AppData\Local\Temp\staff-app-import-validator-tests`).

All invalidation test cases were caught successfully with descriptive English logs:
- **[PASS] Invalid role (teacher)**: Rejected with `Role 'teacher' is not in valid roles`.
- **[PASS] Unknown student reference**: Rejected with `Student ID 'STUD-UNKNOWN-999' does not exist in students roster`.
- **[PASS] Duplicate external_student_id**: Rejected with `Duplicate external_student_id 'STUD-EXAMPLE-001'`.
- **[PASS] Missing required file (students)**: Rejected with `Missing required file matching keywords: students`.
- **[PASS] Malformed date format**: Rejected with `active_from must be a valid YYYY-MM-DD date`.
- **[PASS] Invalid boolean (is_active = yes)**: Rejected with `is_active must be 'true' or 'false'`.
- **[PASS] Duplicate current project for one student**: Rejected with `Student 'STUD-EXAMPLE-001' has 2 projects marked as current. Maximum is 1`.
- **[PASS] Duplicate primary goal for one student**: Rejected with `Student 'STUD-EXAMPLE-001' has 2 goals marked as primary. Maximum is 1`.

---

## 4. Safety Boundaries Preserved
- No database connections or writes were triggered.
- No real student records or staff credentials were created or checked in.
- All CLI output text and code comments are strictly written in English (no Hebrew text in implementation code).

---

## 5. Go/No-Go Recommendation
- **[x] Go: Approved to proceed to Pilot Real-Data Import Implementation v1** (building the transaction-based dry-run and ingestion execution script).
