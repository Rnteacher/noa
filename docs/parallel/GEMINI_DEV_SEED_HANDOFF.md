# Gemini Handoff — Development Seed File

## Summary

Created a draft SQL seed file (`supabase/seeds/dev_seed.sql`) containing mock, English-only testing data. It sets up a deterministic local development database state covering all relational tables, enums, triggers, and Row Level Security policies.

## Files created

- `supabase/seeds/dev_seed.sql`: Local SQL seed file.
- `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`: This handoff document.

## What the seed includes

The seed inserts deterministic data for all core entities in English (no Hebrew names or text used):
- **1 School Year**: `2026-2027 Academic Year`
- **6 Profiles & Auth Users**:
  - Super Admin (`super.admin@example.test`)
  - Manager (`manager.one@example.test`)
  - Mentors (`mentor.one@example.test`, `mentor.two@example.test`)
  - Master (`master.one@example.test`)
  - Counselor (`counselor.one@example.test`)
- **2 Student Groups**: `Software Engineers` and `Robotics League`
- **Group Mentor Slots**: Mentor 1 & 2 mapped to Software Engineers, Mentor 2 mapped to Robotics League.
- **6 Students**: Fake students distributed across both groups.
- **6 Student Projects**: Mapped to projects with Green, Yellow, and Red statuses (e.g., Task Manager App, Local Garden Automation, Smart Garbage Sorter).
- **Student Master Assignments**: Master 1 assigned as primary master to all student projects.
- **Emotional Status Updates**: Historical records containing status values and text notes in English.
- **Student Goals**: Active, completed, and paused goals.
- **Student Messages**: Mock staff notes with tag arrays (e.g. project, attendance, family) and importance flags.
- **Followed Student Links**: Mentor 1 follows Alice, Mentor 2 follows Charlie.
- **2 Announcements**: One general, and one targeted to mentors that requires read acknowledgment.
- **Announcement Target & Read Records**: Mapping reads and read confirmations.
- **2 Calendar Events**: One multi-day Preparation Seminar (staff only) and one parents evening (group targeted).
- **1 Weekly Learning Group**: Monday Software Development Lab scheduled exactly in the allowed 11:30 - 13:30 window.
- **Notifications**: Internal emotional status change alerts.
- **6 Staff Access Grants & Roles**: Email whitelists matching the profile accounts to verify the OAuth signup flow.

## What is intentionally not connected yet

- **supabase/config.toml**: The seed file is stored in `supabase/seeds/dev_seed.sql` instead of `supabase/seed.sql`. This is intentional to prevent local resets (`supabase db reset`) from running it automatically until the team reviews it and updates the project configuration.

## Known limitations

- **Supabase Auth Integration**: Direct `INSERT` statements into `auth.users` are included to establish local testing accounts. If local Supabase configurations alter the internal `auth.users` columns, these inserts might need schema-specific adjustments. The seed uses standard, portable GoTrue columns (`id`, `email`, `encrypted_password`, `email_confirmed_at`, `raw_app_meta_data`, `raw_user_meta_data`, `aud`, `role`, `created_at`, `updated_at`).

## Suggested next task

- **Verify and wire the seed file**: After review, rename or copy `supabase/seeds/dev_seed.sql` to `supabase/seed.sql` to let the local Supabase CLI execute it automatically on every `supabase db reset`. Verify that seed accounts are accessible in Supabase Studio.
