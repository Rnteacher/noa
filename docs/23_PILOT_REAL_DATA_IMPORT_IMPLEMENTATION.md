# 23 - Pilot Real-Data Import Implementation v1

## 1. Executive Summary
This document reviews the implementation, safety models, and verification logs for the local import execution scripts designed to ingest and roll back CSV datasets during the upcoming school pilot.

---

## 2. Files Changed & Created

- [scripts/import/import-types.ts](file:///d:/Projects/staff-app/scripts/import/import-types.ts) [NEW] — Type definitions for CSV records, planned layouts, and JSON manifests.
- [scripts/import/import-plan.ts](file:///d:/Projects/staff-app/scripts/import/import-plan.ts) [NEW] — Converts parsed CSV files into an in-memory import plan with pre-generated UUIDs.
- [scripts/import/import-db.ts](file:///d:/Projects/staff-app/scripts/import/import-db.ts) [NEW] — Database connection initializer with remote host target blockades.
- [scripts/import/run-import.ts](file:///d:/Projects/staff-app/scripts/import/run-import.ts) [NEW] — Import runner orchestrating plan, dry-run, and apply-local modes.
- [scripts/import/rollback-import.ts](file:///d:/Projects/staff-app/scripts/import/rollback-import.ts) [NEW] — Rolls back ingested records by deleting specific UUIDs in reverse dependency order.
- [scripts/import/README.md](file:///d:/Projects/staff-app/scripts/import/README.md) [MODIFY] — Comprehensive developer/operator execution instructions.
- [package.json](file:///d:/Projects/staff-app/package.json) [MODIFY] — Added NPM run scripts.

---

## 3. CLI Commands Reference

- **Plan-Only Generation**:
  ```bash
  npm run import:plan -- --input <csv-folder> --output <manifest-folder>
  ```
- **Dry-Run (Verify + Rollback)**:
  ```bash
  IMPORT_DATABASE_URL="<db-url>" npm run import:dry-run -- --input <csv-folder> --output <manifest-folder> --include-emotional-baseline
  ```
- **Guarded Apply-Local**:
  ```bash
  IMPORT_ALLOW_LOCAL_APPLY=1 IMPORT_DATABASE_URL="<db-url>" npm run import:apply:local -- --input <csv-folder> --output <manifest-folder> --include-emotional-baseline
  ```
- **Guarded Rollback-Local**:
  ```bash
  IMPORT_ALLOW_LOCAL_ROLLBACK=1 IMPORT_DATABASE_URL="<db-url>" npm run import:rollback:local -- --manifest <run-manifest-json-path>
  ```

---

## 4. Import Ingestion Data Flow
```mermaid
graph TD
    A[Roster CSV Files] --> B[validateDirectoryContent]
    B -->|Check constraints & headers| C{Validation OK?}
    C -->|No| D[Log Errors & Abort]
    C -->|Yes| E[buildImportPlan]
    E -->|Pre-generate UUIDs & map FKs| F[InMemoryImportPlan]
    F --> G{Execution Mode?}
    G -->|--plan-only| H[Write planned JSON manifest]
    G -->|--dry-run| I[BEGIN transaction -> Insert -> Verify -> ROLLBACK]
    G -->|--apply-local| J[BEGIN transaction -> Insert -> Verify -> COMMIT -> Write JSON manifest]
```

---

## 5. Database Safety Model
- **Direct Local Connection**: Uses the `pg` package to connect directly to the database. Avoids using Supabase service-role keys.
- **Remote Connection Blockade**: Refuses any non-localhost host unless `IMPORT_ALLOW_REMOTE=1`, `IMPORT_REMOTE_TARGET_NAME` are set, and `--target remote` is passed. Hosted Supabase execution is strictly blocked by default.
- **Local Apply Guard**: Write/Commit operations require the explicit environment variable `IMPORT_ALLOW_LOCAL_APPLY=1`.
- **Local Rollback Guard**: Deleting operations require the explicit environment variable `IMPORT_ALLOW_LOCAL_ROLLBACK=1`.

---

## 6. Staff Profile Resolution Issue
Mentor and project master assignments require corresponding database records in the `public.profiles` table at ingestion time. 
- **The Issue**: Profiles are created on demand when staff sign in via Google OAuth. The script will fail if a mentor or master has not logged in once.
- **Operator Procedure**: Before executing the pilot roster apply, ensure all whitelisted staff members have completed their first sign-in, or resolve missing profiles using a pilot readiness check.

---

## 7. Rollback & Manifest Behavior
- Rollback deletes database rows in reverse dependency order:
  1. `student_emotional_statuses`
  2. `student_goals`
  3. `student_masters`
  4. `projects`
  5. `group_mentors`
  6. `students`
  7. `student_groups`
  8. `staff_access_grant_roles`
  9. `staff_access_grants`
  10. `school_years` (deleted conditionally if not referenced by other groups, projects, or goals).
- **Warning**: Rollback deletes records by their specific generated UUIDs. If staff members make edits or add new records referencing these entities after ingestion, a hard rollback can lead to orphaned data.

---

## 8. Verification & Smoke Test Results
All smoke tests were executed successfully against local database target `postgresql://postgres:postgres@127.0.0.1:54322/postgres`:
- **Examples validation check**: Passed.
- **Plan-Only generation check**: Passed. Manifest written to OS temp directory.
- **Omitted emotional baseline flag negative check**: Caught correctly, script aborted.
- **Remote database host block check**: Caught correctly, connection aborted.
- **Dry-run transaction check**: Completed all inserts, verified unique constraint rules (max 1 current project and primary goal per student), and triggered `ROLLBACK` successfully.
- **Local apply check**: Completed all inserts, verified constraints, and triggered `COMMIT` successfully.
- **Local rollback check**: Deleted all generated rows in reverse dependency order, restoring database state to dev seed baseline.

---

## 9. Blocked Production Execution Statement
**Hosted database write/apply execution is strictly locked and cannot be run using these scripts in this version.** All operations are restricted to localhost targets.

---

## 10. Recommended Next Task
**Pilot Staff Profile Readiness Check v1**: Build a local operator preflight tool to query whitelisted staff emails, check which accounts have not signed in yet (missing active profiles), and generate a readiness report before the pilot import dry-run.
