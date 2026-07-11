import fs from 'fs';
import path from 'path';
import { getDbClient } from './import-db';
import type { ImportRunManifest } from './import-types';

async function main() {
  const args = process.argv.slice(2);

  const manifestIdx = args.indexOf('--manifest');
  const manifestPath = manifestIdx !== -1 ? args[manifestIdx + 1] : '';

  if (!manifestPath) {
    console.error('[ERROR] Missing required argument: --manifest <file-path>');
    process.exit(1);
  }

  // 1. Env Var Guard
  if (process.env.IMPORT_ALLOW_LOCAL_ROLLBACK !== '1') {
    console.error(
      `[ERROR] Rollback mode requested, but IMPORT_ALLOW_LOCAL_ROLLBACK=1 is missing in environment.`
    );
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), manifestPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Manifest file does not exist at path: ${fullPath}`);
    process.exit(1);
  }

  // 2. Load and parse manifest
  let manifest: ImportRunManifest;
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    const error = err as Error;
    console.error(`[ERROR] Failed to parse manifest JSON file: ${error.message}`);
    process.exit(1);
  }

  // Verify structure
  if (!manifest.import_batch_id || !manifest.generated_ids || !manifest.counts) {
    console.error(`[ERROR] Invalid manifest file structure. Missing required metadata or IDs.`);
    process.exit(1);
  }

  // Rollback warning
  console.log(`[WARNING] Rollback requested for batch: ${manifest.import_batch_id}`);
  console.log(`[WARNING] If staff have edited imported records since ingestion, a hard rollback could lead to orphaned data.`);
  console.log(`[WARNING] Please ensure you have backed up the database before continuing.`);

  // 3. DB connection (Local only)
  // Rollback is always local target in v1
  const dbClient = getDbClient('local');
  try {
    await dbClient.connect();
    console.log(`[INFO] Beginning rollback transaction...`);
    await dbClient.query('BEGIN;');

    const generated = manifest.generated_ids;

    // Deletion in reverse dependency order:
    // 1. student_emotional_statuses
    if (generated.student_emotional_statuses && generated.student_emotional_statuses.length > 0) {
      console.log(`[INFO] Deleting emotional status baseline records...`);
      const res = await dbClient.query(
        `DELETE FROM public.student_emotional_statuses WHERE id = ANY($1);`,
        [generated.student_emotional_statuses]
      );
      console.log(` - Deleted ${res.rowCount} emotional baseline rows.`);
    }

    // 2. student_goals
    if (generated.student_goals && generated.student_goals.length > 0) {
      console.log(`[INFO] Deleting student goals...`);
      const res = await dbClient.query(
        `DELETE FROM public.student_goals WHERE id = ANY($1);`,
        [generated.student_goals]
      );
      console.log(` - Deleted ${res.rowCount} goal rows.`);
    }

    // 3. student_masters
    if (generated.student_masters && generated.student_masters.length > 0) {
      console.log(`[INFO] Deleting student master assignments...`);
      const res = await dbClient.query(
        `DELETE FROM public.student_masters WHERE id = ANY($1);`,
        [generated.student_masters]
      );
      console.log(` - Deleted ${res.rowCount} master assignment rows.`);
    }

    // 4. projects
    if (generated.projects && generated.projects.length > 0) {
      console.log(`[INFO] Deleting student projects...`);
      const res = await dbClient.query(
        `DELETE FROM public.projects WHERE id = ANY($1);`,
        [generated.projects]
      );
      console.log(` - Deleted ${res.rowCount} project rows.`);
    }

    // 5. group_mentors
    if (generated.group_mentors && generated.group_mentors.length > 0) {
      console.log(`[INFO] Deleting group mentor assignments...`);
      const res = await dbClient.query(
        `DELETE FROM public.group_mentors WHERE id = ANY($1);`,
        [generated.group_mentors]
      );
      console.log(` - Deleted ${res.rowCount} mentor assignment rows.`);
    }

    // 6. students
    if (generated.students && generated.students.length > 0) {
      console.log(`[INFO] Deleting students...`);
      const res = await dbClient.query(
        `DELETE FROM public.students WHERE id = ANY($1);`,
        [generated.students]
      );
      console.log(` - Deleted ${res.rowCount} student rows.`);
    }

    // 7. student_groups
    if (generated.student_groups && generated.student_groups.length > 0) {
      console.log(`[INFO] Deleting student groups...`);
      const res = await dbClient.query(
        `DELETE FROM public.student_groups WHERE id = ANY($1);`,
        [generated.student_groups]
      );
      console.log(` - Deleted ${res.rowCount} group rows.`);
    }

    // 8. staff_access_grant_roles
    if (generated.staff_access_grant_roles && generated.staff_access_grant_roles.length > 0) {
      console.log(`[INFO] Deleting staff access roles...`);
      // Since staff_access_grant_roles might have been added/configured, we delete entries linked to imported grant IDs.
      const res = await dbClient.query(
        `DELETE FROM public.staff_access_grant_roles WHERE grant_id = ANY($1);`,
        [generated.staff_access_grants]
      );
      console.log(` - Deleted ${res.rowCount} access role rows.`);
    }

    // 9. staff_access_grants
    if (generated.staff_access_grants && generated.staff_access_grants.length > 0) {
      console.log(`[INFO] Deleting staff access grants...`);
      const res = await dbClient.query(
        `DELETE FROM public.staff_access_grants WHERE id = ANY($1);`,
        [generated.staff_access_grants]
      );
      console.log(` - Deleted ${res.rowCount} access grant rows.`);
    }

    // 10. school_years (only if created by this import and not referenced by other records)
    if (generated.school_years && generated.school_years.length > 0) {
      for (const yearId of generated.school_years) {
        console.log(`[INFO] Checking references for school year ID: ${yearId}`);
        const refRes = await dbClient.query(
          `SELECT (
             EXISTS(SELECT 1 FROM public.student_groups WHERE school_year_id = $1 LIMIT 1) OR
             EXISTS(SELECT 1 FROM public.projects WHERE school_year_id = $1 LIMIT 1) OR
             EXISTS(SELECT 1 FROM public.student_goals WHERE school_year_id = $1 LIMIT 1)
           ) AS referenced;`,
          [yearId]
        );
        const referenced = refRes.rows[0]?.referenced || false;

        if (referenced) {
          console.log(`[INFO] School year ID '${yearId}' is referenced by other records. Skipping deletion.`);
        } else {
          console.log(`[INFO] Deleting school year ID '${yearId}'...`);
          await dbClient.query(`DELETE FROM public.school_years WHERE id = $1;`, [yearId]);
        }
      }
    }

    console.log(`[INFO] Committing rollback transaction...`);
    await dbClient.query('COMMIT;');

    // Update manifest to indicate it has been rolled back
    manifest.rollback_eligible = false;
    fs.writeFileSync(fullPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log(`[SUCCESS] Rollback batch '${manifest.import_batch_id}' finished successfully!`);
  } catch (err) {
    const error = err as Error;
    console.error(`[ERROR] Rollback transaction failed. Rolling back rollback attempt...`);
    console.error(`Reason: ${error.message}`);
    try {
      await dbClient.query('ROLLBACK;');
    } catch {
      // Ignore nested rollback failure
    }
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

main().catch((err) => {
  const error = err as Error;
  console.error(`[FATAL] ${error.message}`);
  process.exit(1);
});
