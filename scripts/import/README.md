# Real-Data CSV Ingestion & Rollback Tooling

This directory contains utility scripts to validate, plan, dry-run, insert, and rollback student and staff rosters during controlled school pilot operations.

## Commands

### 1. Validation
Verifies populated CSV files locally against schema constraints, allowed domains, unique rules, and foreign key alignments:
```bash
npm run validate:import -- <csv-directory-path>
```

### 2. In-Memory Import Plan
Parses validated CSV files, generates UUIDs for new records, maps relationships, and produces a planned run manifest JSON:
```bash
npm run import:plan -- --input <csv-directory-path> --output <output-manifest-directory-path>
```

### 3. Dry-Run (Local Transaction Ingestion + Rollback)
Connects to the database, wraps all ingestion operations in a PostgreSQL transaction (`BEGIN`), performs checks, logs count outcomes, and then triggers a secure rollback:
```bash
IMPORT_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" \
npm run import:dry-run -- --input <csv-directory-path> --output <output-manifest-directory-path> --include-emotional-baseline
```

### 4. Guarded Local Apply
Performs the ingestion and commits the database transaction:
```bash
IMPORT_ALLOW_LOCAL_APPLY=1 \
IMPORT_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" \
npm run import:apply:local -- --input <csv-directory-path> --output <output-manifest-directory-path> --include-emotional-baseline
```

### 5. Guarded Local Rollback
Deletes inserted rows in reverse dependency order using the exact generated UUIDs logged in the run manifest:
```bash
IMPORT_ALLOW_LOCAL_ROLLBACK=1 \
IMPORT_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" \
npm run import:rollback:local -- --manifest <run-manifest-json-path>
```

---

## Required Environment Variables & Locks

- `IMPORT_DATABASE_URL`: Connection string to the target database.
- `IMPORT_ALLOW_LOCAL_APPLY=1`: Must be explicitly set to allow local commit execution.
- `IMPORT_ALLOW_LOCAL_ROLLBACK=1`: Must be explicitly set to allow local rollback execution.
- **Production Lock**: Any remote/hosted host connection (non-localhost) is locked by default. Attempting remote execution will exit with a fatal lock error.

---

## Safety Guidelines for Operators

1. **Keep Roster Files Outside the Repository**: Never create, populate, or commit real student or staff spreadsheets in this workspace. Always run import operations targeting directories located outside this repository.
2. **Staff Profile Prerequisite**: Mentor and project master assignments require corresponding database records in the `profiles` table at execution time. The script will fail if referenced emails do not exist. Staff members must log in at least once via Google OAuth to register their profile before assignments can be imported.
3. **Emotional Status Baseline Approval**: Ingestion of emotional baselines requires the explicit `--include-emotional-baseline` CLI flag. Without it, the script fails safely if baseline records exist.
4. **Rollback Warning**: Rollback deletes records by their specific generated UUIDs. If staff members make edits or add new records referencing these entities after ingestion, a hard rollback can lead to orphaned data. Verify database state before performing rollbacks.
