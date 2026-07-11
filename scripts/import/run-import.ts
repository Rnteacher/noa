import fs from 'fs';
import path from 'path';
import { validateDirectoryContent, parseCsv } from './validate-real-data';
import { buildImportPlan } from './import-plan';
import { getDbClient } from './import-db';
import type { ImportRunManifest } from './import-types';

async function main() {
  const args = process.argv.slice(2);

  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');
  const targetIdx = args.indexOf('--target');

  const inputFolder = inputIdx !== -1 ? args[inputIdx + 1] : '';
  const outputFolder = outputIdx !== -1 ? args[outputIdx + 1] : '';
  const target = targetIdx !== -1 ? (args[targetIdx + 1] as 'local' | 'remote') : 'local';

  const planOnly = args.includes('--plan-only');
  const dryRun = args.includes('--dry-run') || (!planOnly && !args.includes('--apply-local'));
  const applyLocal = args.includes('--apply-local');
  const includeEmotionalBaseline = args.includes('--include-emotional-baseline');

  if (!inputFolder || !outputFolder) {
    console.error('[ERROR] Missing required arguments: --input <folder> --output <folder>');
    process.exit(1);
  }

  // 1. Validate target directory content
  let validationResult;
  try {
    validationResult = validateDirectoryContent(path.resolve(process.cwd(), inputFolder));
  } catch (err) {
    const error = err as Error;
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  }

  const { ctx, resolvedPaths } = validationResult;
  if (ctx.errors.length > 0) {
    console.error(`[ERROR] CSV files failed validation checks. Cannot proceed to import.`);
    ctx.errors.forEach((err) => console.error(` - [ERR] ${err}`));
    process.exit(1);
  }

  // Negative Check: Emotional baseline exists but flag is omitted
  if (resolvedPaths.emotionalBaseline && !includeEmotionalBaseline) {
    const baselineRows = parseCsv(fs.readFileSync(resolvedPaths.emotionalBaseline, 'utf8'));
    if (baselineRows.length > 1) {
      console.error(
        `[ERROR] Emotional baseline data exists in CSV, but --include-emotional-baseline was not specified. Refusing to import.`
      );
      process.exit(1);
    }
  }

  // 2. Build in-memory import plan
  console.log(`[INFO] Building in-memory import plan...`);
  const plan = buildImportPlan(resolvedPaths, includeEmotionalBaseline);

  // Initialize mapping counts
  const counts: Record<string, number> = {
    school_years: 1,
    staff_access_grants: plan.staffGrants.length,
    staff_access_grant_roles: plan.staffRoles.length,
    student_groups: plan.studentGroups.length,
    students: plan.students.length,
    group_mentors: plan.groupMentors.length,
    projects: plan.projects.length,
    student_masters: plan.studentMasters.length,
    student_goals: plan.studentGoals.length,
    student_emotional_statuses: plan.emotionalBaselines.length,
  };

  const studentExtToUuid: Record<string, string> = {};
  for (const s of plan.students) {
    studentExtToUuid[s.external_student_id] = s.generated_id;
  }

  const generatedIds: Record<string, string[]> = {
    school_years: [plan.schoolYear.generated_id],
    staff_access_grants: plan.staffGrants.map((g) => g.generated_id),
    staff_access_grant_roles: plan.staffRoles.map((r) => r.generated_id),
    student_groups: plan.studentGroups.map((g) => g.generated_id),
    students: plan.students.map((s) => s.generated_id),
    group_mentors: plan.groupMentors.map((m) => m.generated_id),
    projects: plan.projects.map((p) => p.generated_id),
    student_masters: plan.studentMasters.map((m) => m.generated_id),
    student_goals: plan.studentGoals.map((g) => g.generated_id),
    student_emotional_statuses: plan.emotionalBaselines.map((e) => e.generated_id),
  };

  const timestamp = new Date().toISOString();
  const manifest: ImportRunManifest = {
    import_batch_id: plan.schoolYear.import_batch_id,
    timestamp,
    mode: planOnly ? 'plan-only' : applyLocal ? 'apply-local' : 'dry-run',
    input_folder_path: inputFolder,
    generated_ids: generatedIds,
    external_student_id_to_uuid: studentExtToUuid,
    counts,
    warnings: ctx.warnings,
    rollback_eligible: !planOnly,
  };

  // 3. Plan-only mode exit early
  if (planOnly) {
    console.log(`[SUCCESS] Plan built successfully. Writing planned manifest file...`);
    writeManifest(outputFolder, plan.schoolYear.import_batch_id, manifest);
    process.exit(0);
  }

  // 4. DB Execution Mode (Dry-run or Apply-local)
  if (applyLocal) {
    if (process.env.IMPORT_ALLOW_LOCAL_APPLY !== '1') {
      console.error(
        `[ERROR] Apply mode requested, but IMPORT_ALLOW_LOCAL_APPLY=1 is missing in environment.`
      );
      process.exit(1);
    }
    if (target !== 'local') {
      console.error(`[ERROR] Remote target is strictly forbidden for write/apply mode in this version.`);
      process.exit(1);
    }
  }

  const dbClient = getDbClient(target);
  try {
    await dbClient.connect();
    console.log(`[INFO] Beginning database transaction...`);
    await dbClient.query('BEGIN;');

    // 5. Ingestion in Dependency Order

    // A. School Year
    console.log(`[INFO] Upserting school year: ${plan.schoolYear.name}`);
    let actualSchoolYearId = plan.schoolYear.generated_id;
    const schoolYearCheck = await dbClient.query(
      `SELECT id FROM public.school_years WHERE name = $1;`,
      [plan.schoolYear.name]
    );
    if ((schoolYearCheck.rowCount ?? 0) > 0) {
      actualSchoolYearId = schoolYearCheck.rows[0].id;
      console.log(`[INFO] Reusing existing school year ID: ${actualSchoolYearId}`);
    } else {
      const currentCheck = await dbClient.query(
        `SELECT id FROM public.school_years WHERE is_current = true;`
      );
      const isCurrent = (currentCheck.rowCount ?? 0) === 0;

      await dbClient.query(
        `INSERT INTO public.school_years (id, name, starts_on, ends_on, is_current)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          plan.schoolYear.generated_id,
          plan.schoolYear.name,
          plan.schoolYear.starts_on,
          plan.schoolYear.ends_on,
          isCurrent,
        ]
      );
    }

    // B. Staff Access Grants
    console.log(`[INFO] Inserting staff access grants...`);
    for (const grant of plan.staffGrants) {
      await dbClient.query(
        `INSERT INTO public.staff_access_grants (id, email, is_active)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET is_active = EXCLUDED.is_active;`,
        [grant.generated_id, grant.email, grant.is_active]
      );
    }

    // C. Staff Access Grant Roles
    console.log(`[INFO] Inserting staff access grant roles...`);
    for (const r of plan.staffRoles) {
      // Find grant ID
      const grantRes = await dbClient.query(
        `SELECT id FROM public.staff_access_grants WHERE email = $1;`,
        [r.email]
      );
      if ((grantRes.rowCount ?? 0) === 0) {
        throw new Error(`Orphan role email '${r.email}' without corresponding access grant row.`);
      }
      const grantId = grantRes.rows[0].id;
      await dbClient.query(
        `INSERT INTO public.staff_access_grant_roles (grant_id, role)
         VALUES ($1, $2)
         ON CONFLICT (grant_id, role) DO NOTHING;`,
        [grantId, r.role]
      );
    }

    // D. Student Groups
    console.log(`[INFO] Inserting student groups...`);
    for (const group of plan.studentGroups) {
      const groupCheck = await dbClient.query(
        `SELECT id FROM public.student_groups WHERE school_year_id = $1 AND name = $2;`,
        [actualSchoolYearId, group.name]
      );
      if ((groupCheck.rowCount ?? 0) > 0) {
        console.log(`[INFO] Reusing existing group: ${group.name}`);
      } else {
        await dbClient.query(
          `INSERT INTO public.student_groups (id, school_year_id, name, layer, is_active)
           VALUES ($1, $2, $3, $4, $5);`,
          [group.generated_id, actualSchoolYearId, group.name, group.layer || null, group.is_active]
        );
      }
    }

    // E. Students
    console.log(`[INFO] Inserting student roster...`);
    for (const s of plan.students) {
      // Resolve group ID
      const groupRes = await dbClient.query(
        `SELECT id FROM public.student_groups WHERE school_year_id = $1 AND name = $2;`,
        [actualSchoolYearId, s.group_name]
      );
      if ((groupRes.rowCount ?? 0) === 0) {
        throw new Error(`Group '${s.group_name}' not found for school year.`);
      }
      const groupId = groupRes.rows[0].id;

      await dbClient.query(
        `INSERT INTO public.students (
          id, first_name, last_name, group_id, school_year_id, is_active,
          primary_phone, secondary_phone, emergency_contact_name, emergency_contact_phone
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          group_id = EXCLUDED.group_id;`,
        [
          s.generated_id,
          s.first_name,
          s.last_name,
          groupId,
          actualSchoolYearId,
          s.is_active,
          s.primary_phone || null,
          s.secondary_phone || null,
          s.emergency_contact_name || null,
          s.emergency_contact_phone || null,
        ]
      );
    }

    // F. Group Mentors
    console.log(`[INFO] Inserting group mentors...`);
    for (const m of plan.groupMentors) {
      // Resolve profile ID from staff email
      const profileRes = await dbClient.query(
        `SELECT id FROM public.profiles WHERE email = $1;`,
        [m.mentor_email]
      );
      if ((profileRes.rowCount ?? 0) === 0) {
        throw new Error(
          `Staff profile email '${m.mentor_email}' is missing. Mentor must sign in via Google OAuth once before import.`
        );
      }
      const mentorId = profileRes.rows[0].id;

      // Resolve group ID
      const groupRes = await dbClient.query(
        `SELECT id FROM public.student_groups WHERE school_year_id = $1 AND name = $2;`,
        [actualSchoolYearId, m.group_name]
      );
      if ((groupRes.rowCount ?? 0) === 0) {
        throw new Error(`Group '${m.group_name}' not found for group mentors.`);
      }
      const groupId = groupRes.rows[0].id;

      await dbClient.query(
        `INSERT INTO public.group_mentors (id, group_id, mentor_id, is_primary, active_from, active_until)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [m.generated_id, groupId, mentorId, m.is_primary, m.active_from, m.active_until || null]
      );
    }

    // G. Projects
    console.log(`[INFO] Inserting student projects...`);
    for (const p of plan.projects) {
      await dbClient.query(
        `INSERT INTO public.projects (id, student_id, school_year_id, title, description, status, is_current)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [p.generated_id, p.student_id, actualSchoolYearId, p.project_title, p.description || null, p.status, p.is_current]
      );
    }

    // H. Student Masters
    console.log(`[INFO] Inserting student master assignments...`);
    for (const m of plan.studentMasters) {
      // Resolve profile ID
      const profileRes = await dbClient.query(
        `SELECT id FROM public.profiles WHERE email = $1;`,
        [m.master_email]
      );
      if ((profileRes.rowCount ?? 0) === 0) {
        throw new Error(
          `Staff profile email '${m.master_email}' is missing. Project master must sign in via Google OAuth once before import.`
        );
      }
      const masterId = profileRes.rows[0].id;

      // Find student project ID (if any)
      const projectRes = await dbClient.query(
        `SELECT id FROM public.projects WHERE student_id = $1 AND school_year_id = $2 AND is_current = true LIMIT 1;`,
        [m.student_id, actualSchoolYearId]
      );
      const projectId = (projectRes.rowCount ?? 0) > 0 ? projectRes.rows[0].id : null;

      await dbClient.query(
        `INSERT INTO public.student_masters (id, student_id, project_id, master_id, is_primary, active_from, active_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [m.generated_id, m.student_id, projectId, masterId, m.is_primary, m.active_from, m.active_until || null]
      );
    }

    // I. Student Goals
    console.log(`[INFO] Inserting student goals...`);
    for (const g of plan.studentGoals) {
      await dbClient.query(
        `INSERT INTO public.student_goals (id, student_id, school_year_id, title, description, status, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [g.generated_id, g.student_id, actualSchoolYearId, g.goal_title, g.description || null, g.status, g.is_primary]
      );
    }

    // J. Student Emotional Status Baseline (Optional)
    if (includeEmotionalBaseline) {
      console.log(`[INFO] Inserting emotional status baseline records...`);
      for (const e of plan.emotionalBaselines) {
        await dbClient.query(
          `INSERT INTO public.student_emotional_statuses (id, student_id, status, note, created_at)
           VALUES ($1, $2, $3, $4, $5);`,
          [e.generated_id, e.student_id, e.status, e.note || null, e.created_at]
        );
      }
    }

    // 6. Verification Checks inside transaction

    console.log(`[INFO] Running relational safety checks...`);

    // Rule 1: Max 1 current project per student
    const projectCheck = await dbClient.query(
      `SELECT student_id, COUNT(*) FROM public.projects WHERE is_current = true GROUP BY student_id HAVING COUNT(*) > 1;`
    );
    if ((projectCheck.rowCount ?? 0) > 0) {
      throw new Error(`Post-verification failed: Some students have more than one current project.`);
    }

    // Rule 2: Max 1 primary goal per student per school year
    const goalCheck = await dbClient.query(
      `SELECT student_id, school_year_id, COUNT(*) FROM public.student_goals WHERE is_primary = true GROUP BY student_id, school_year_id HAVING COUNT(*) > 1;`
    );
    if ((goalCheck.rowCount ?? 0) > 0) {
      throw new Error(`Post-verification failed: Some students have more than one primary goal in the same school year.`);
    }

    // 7. Commit or Rollback
    if (dryRun) {
      console.log(`[INFO] Dry-run verification passed! Rolling back transaction...`);
      await dbClient.query('ROLLBACK;');
      writeManifest(outputFolder, plan.schoolYear.import_batch_id, manifest);
      console.log(`[SUCCESS] Dry-run execution succeeded. Mock manifest written to output folder.`);
    } else if (applyLocal) {
      console.log(`[INFO] Verification checks passed. Committing transaction...`);
      await dbClient.query('COMMIT;');
      writeManifest(outputFolder, plan.schoolYear.import_batch_id, manifest);
      console.log(`[SUCCESS] Local apply ingestion completed successfully! Run manifest created.`);
    }
  } catch (err) {
    const error = err as Error;
    console.error(`[ERROR] DB Ingestion encountered fatal error. Rolling back changes...`);
    console.error(`Reason: ${error.message}`);
    try {
      await dbClient.query('ROLLBACK;');
    } catch {
      // Ignore nested rollback failure if connection was severed
    }
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

function writeManifest(outputFolder: string, batchId: string, manifest: ImportRunManifest) {
  try {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const outputPath = path.join(outputFolder, `import-run-${batchId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[INFO] Run manifest written to: ${outputPath}`);
  } catch (err) {
    const error = err as Error;
    console.warn(`[CRITICAL WARNING] Failed to write import run manifest file: ${error.message}`);
    console.warn(`Manifest details: Batch ID: ${batchId}, Mode: ${manifest.mode}`);
  }
}

main().catch((err) => {
  const error = err as Error;
  console.error(`[FATAL] ${error.message}`);
  process.exit(1);
});
