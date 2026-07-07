-- ==========================================
-- Chamama Staff App - Local Development Seed
-- Location: supabase/seeds/dev_seed.sql
-- Description: Deterministic mock data for local testing. English-only.
-- ==========================================

-- 1. SCHOOL YEARS
INSERT INTO public.school_years (
  id,
  name,
  starts_on,
  ends_on,
  is_current,
  created_at,
  updated_at
) VALUES (
  '26000000-0000-0000-0000-000000002026',
  '2026-2027 Academic Year',
  '2026-09-01',
  '2027-06-30',
  true,
  '2026-09-01 08:00:00+00',
  '2026-09-01 08:00:00+00'
) ON CONFLICT (id) DO NOTHING;


-- 2. AUTH USERS (Supabase GoTrue Schema)
-- Local development only: these deterministic fake auth.users rows support local profile foreign keys.
-- Do not use this pattern for production data, real staff accounts, or real student data.
-- Password hash is for the local mock password "password123".
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) VALUES
('a1000000-0000-4000-8000-000000000001', 'super.admin@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000002', 'manager.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000003', 'mentor.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000004', 'mentor.two@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000005', 'master.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000006', 'counselor.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000007', 'leadership.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000008', 'staff.one@example.test', '$2b$10$tIYdMAMlzQuMp3LcuJqCGedv/3QyNW7JfPyYQP/tXR.OMTVl7A3.a', '2026-09-01 08:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 3. PROFILES (App Schema)
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  avatar_url,
  phone,
  is_active,
  created_at,
  updated_at
) VALUES
('a1000000-0000-4000-8000-000000000001', 'Super Admin User', 'super.admin@example.test', NULL, '+972500000001', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000002', 'Manager One User', 'manager.one@example.test', NULL, '+972500000002', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000003', 'Mentor One User', 'mentor.one@example.test', NULL, '+972500000003', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000004', 'Mentor Two User', 'mentor.two@example.test', NULL, '+972500000004', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000005', 'Master One User', 'master.one@example.test', NULL, '+972500000005', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000006', 'Counselor One User', 'counselor.one@example.test', NULL, '+972500000006', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000007', 'Leadership One User', 'leadership.one@example.test', NULL, '+972500000007', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('a1000000-0000-4000-8000-000000000008', 'Staff One User', 'staff.one@example.test', NULL, '+972500000008', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 4. PROFILE ROLES
INSERT INTO public.profile_roles (id, profile_id, role, created_at) VALUES
('41000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'super_admin', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'manager', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'mentor', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004', 'mentor', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000004', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000005', 'master', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000005', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000006', 'counselor', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000006', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000007', 'leadership', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000007', 'staff', '2026-09-01 08:00:00+00'),
('41000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000008', 'staff', '2026-09-01 08:00:00+00')
ON CONFLICT (profile_id, role) DO NOTHING;


-- 5. STUDENT GROUPS
INSERT INTO public.student_groups (
  id,
  school_year_id,
  name,
  layer,
  is_active,
  created_at,
  updated_at
) VALUES
('11000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Software Engineers', 'Tenth', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('11000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Robotics League', 'Eleventh', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 6. GROUP MENTORS
INSERT INTO public.group_mentors (
  id,
  group_id,
  mentor_id,
  is_primary,
  active_from,
  active_until,
  created_at,
  updated_at
) VALUES
('42000000-0000-4000-8000-000000000001', '11000000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000003', true, '2026-09-01', NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('42000000-0000-4000-8000-000000000002', '11000000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000004', false, '2026-09-01', NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('42000000-0000-4000-8000-000000000003', '11000000-0000-0000-0000-000000000002', 'a1000000-0000-4000-8000-000000000004', true, '2026-09-01', NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('42000000-0000-4000-8000-000000000004', '11000000-0000-0000-0000-000000000002', 'a1000000-0000-4000-8000-000000000003', false, '2026-09-01', NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 7. STUDENTS
INSERT INTO public.students (
  id,
  school_year_id,
  group_id,
  first_name,
  last_name,
  photo_url,
  primary_phone,
  secondary_phone,
  emergency_contact_name,
  emergency_contact_phone,
  is_active,
  created_at,
  updated_at
) VALUES
('55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Alice', 'Smith', NULL, '+972511111111', '+972511111112', 'Mary Smith', '+972511111113', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Bob', 'Johnson', NULL, '+972522222221', NULL, 'Robert Johnson', '+972522222222', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Charlie', 'Brown', NULL, '+972533333331', NULL, 'Lucy Brown', '+972533333332', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('55000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'David', 'Davis', NULL, '+972544444441', NULL, 'Sarah Davis', '+972544444442', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('55000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'Eva', 'Green', NULL, '+972555555551', NULL, 'John Green', '+972555555552', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('55000000-0000-0000-0000-000000000006', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'Frank', 'White', NULL, '+972566666661', NULL, 'Elizabeth White', '+972566666662', true, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 8. PROJECTS (Green, Yellow, Red Statuses Included)
INSERT INTO public.projects (
  id,
  student_id,
  school_year_id,
  title,
  description,
  status,
  status_note,
  is_current,
  created_by,
  updated_by,
  created_at,
  updated_at
) VALUES
('77000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Task Manager App', 'A mobile app to keep track of school assignments.', 'green', 'Everything is on schedule.', true, 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', '2026-09-02 09:00:00+00', '2026-09-02 09:00:00+00'),
('77000000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Local Garden Automation', 'Using sensors to water a garden automatically.', 'yellow', 'Waiting for hardware parts to arrive.', true, 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '2026-09-02 09:10:00+00', '2026-09-02 09:10:00+00'),
('77000000-0000-0000-0000-000000000003', '55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', 'Smart Sorter', 'A camera-assisted model that sorts classroom recycling.', 'red', 'Struggling with model training and integration.', true, 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '2026-09-02 09:20:00+00', '2026-09-02 09:20:00+00'),
('77000000-0000-0000-0000-000000000004', '55000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000002026', 'Self-Balancing Robot', 'A two-wheeled balance robot.', 'green', 'Controller tuning is stable.', true, 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '2026-09-02 09:30:00+00', '2026-09-02 09:30:00+00'),
('77000000-0000-0000-0000-000000000005', '55000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000002026', 'Solar Tracking Panel', 'A panel that moves according to sunlight.', 'green', 'First prototype completed.', true, 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '2026-09-02 09:40:00+00', '2026-09-02 09:40:00+00'),
('77000000-0000-0000-0000-000000000006', '55000000-0000-0000-0000-000000000006', '26000000-0000-0000-0000-000000002026', 'Robot Arm Grabber', 'An ARM-based robotic arm.', 'yellow', 'Motor power supply issues.', true, 'a1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', '2026-09-02 09:50:00+00', '2026-09-02 09:50:00+00')
ON CONFLICT (id) DO NOTHING;


-- 9. STUDENT MASTERS
INSERT INTO public.student_masters (
  id,
  student_id,
  project_id,
  master_id,
  is_primary,
  active_from,
  active_until,
  created_at,
  updated_at
) VALUES
('43000000-0000-4000-8000-000000000001', '55000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:00:00+00', '2026-09-02 10:00:00+00'),
('43000000-0000-4000-8000-000000000002', '55000000-0000-0000-0000-000000000002', '77000000-0000-0000-0000-000000000002', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:10:00+00', '2026-09-02 10:10:00+00'),
('43000000-0000-4000-8000-000000000003', '55000000-0000-0000-0000-000000000003', '77000000-0000-0000-0000-000000000003', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:20:00+00', '2026-09-02 10:20:00+00'),
('43000000-0000-4000-8000-000000000004', '55000000-0000-0000-0000-000000000004', '77000000-0000-0000-0000-000000000004', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:30:00+00', '2026-09-02 10:30:00+00'),
('43000000-0000-4000-8000-000000000005', '55000000-0000-0000-0000-000000000005', '77000000-0000-0000-0000-000000000005', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:40:00+00', '2026-09-02 10:40:00+00'),
('43000000-0000-4000-8000-000000000006', '55000000-0000-0000-0000-000000000006', '77000000-0000-0000-0000-000000000006', 'a1000000-0000-4000-8000-000000000005', true, '2026-09-01', NULL, '2026-09-02 10:50:00+00', '2026-09-02 10:50:00+00')
ON CONFLICT (id) DO NOTHING;


-- 10. STUDENT EMOTIONAL STATUSES (History Included)
INSERT INTO public.student_emotional_statuses (
  id,
  student_id,
  status,
  note,
  created_by,
  created_at
) VALUES
('44000000-0000-4000-8000-000000000001', '55000000-0000-0000-0000-000000000001', 'green', 'Doing well academically and socially.', 'a1000000-0000-4000-8000-000000000003', '2026-09-08 09:00:00+00'),
('44000000-0000-4000-8000-000000000002', '55000000-0000-0000-0000-000000000002', 'green', 'Participating well.', 'a1000000-0000-4000-8000-000000000003', '2026-09-05 09:00:00+00'),
('44000000-0000-4000-8000-000000000003', '55000000-0000-0000-0000-000000000002', 'yellow', 'Appears tired and stressed lately.', 'a1000000-0000-4000-8000-000000000003', '2026-09-09 09:00:00+00'),
('44000000-0000-4000-8000-000000000004', '55000000-0000-0000-0000-000000000003', 'green', 'Initial interview went fine.', 'a1000000-0000-4000-8000-000000000003', '2026-09-01 09:00:00+00'),
('44000000-0000-4000-8000-000000000005', '55000000-0000-0000-0000-000000000003', 'yellow', 'Reported a heavy workload.', 'a1000000-0000-4000-8000-000000000003', '2026-09-05 10:00:00+00'),
('44000000-0000-4000-8000-000000000006', '55000000-0000-0000-0000-000000000003', 'red', 'Missing classes and family concerns reported.', 'a1000000-0000-4000-8000-000000000006', '2026-09-09 10:00:00+00'),
('44000000-0000-4000-8000-000000000007', '55000000-0000-0000-0000-000000000004', 'green', 'Highly engaged and collaborative.', 'a1000000-0000-4000-8000-000000000004', '2026-09-06 09:00:00+00'),
('44000000-0000-4000-8000-000000000008', '55000000-0000-0000-0000-000000000005', 'green', 'Consistent performer and communicative.', 'a1000000-0000-4000-8000-000000000004', '2026-09-07 09:00:00+00'),
('44000000-0000-4000-8000-000000000009', '55000000-0000-0000-0000-000000000006', 'yellow', 'Struggling with time management.', 'a1000000-0000-4000-8000-000000000004', '2026-09-08 10:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 11. STUDENT GOALS
INSERT INTO public.student_goals (
  id,
  student_id,
  school_year_id,
  title,
  description,
  status,
  is_primary,
  visible_to_student,
  created_by,
  updated_by,
  created_at,
  updated_at
) VALUES
('45000000-0000-4000-8000-000000000001', '55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Complete Next.js layout', 'Establish structure and basic routing.', 'completed', false, false, 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '2026-09-03 09:00:00+00', '2026-09-07 09:00:00+00'),
('45000000-0000-4000-8000-000000000002', '55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Integrate Supabase Auth', 'Google OAuth with domain restrictions.', 'active', true, false, 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '2026-09-08 09:00:00+00', '2026-09-08 09:00:00+00'),
('45000000-0000-4000-8000-000000000003', '55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Assemble breadboard circuit', 'Wire sensors and check power flow.', 'active', true, false, 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '2026-09-08 10:00:00+00', '2026-09-08 10:00:00+00'),
('45000000-0000-4000-8000-000000000004', '55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', 'Train basic sorting model', 'Train a classifier on a mock recycling dataset.', 'paused', false, false, 'a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '2026-09-05 09:00:00+00', '2026-09-09 09:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 12. STUDENT MESSAGES (Staff Notes)
INSERT INTO public.student_messages (
  id,
  student_id,
  author_id,
  body,
  tags,
  is_important,
  created_at,
  updated_at
) VALUES
('46000000-0000-4000-8000-000000000001', '55000000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'Alice completed the first task and is moving quickly.', array['project'::public.student_message_tag], false, '2026-09-08 11:00:00+00', '2026-09-08 11:00:00+00'),
('46000000-0000-4000-8000-000000000002', '55000000-0000-0000-0000-000000000003', 'a1000000-0000-4000-8000-000000000006', 'Charlie missed three sessions this week. Follow-up is needed.', array['attendance'::public.student_message_tag, 'family'::public.student_message_tag], true, '2026-09-09 11:00:00+00', '2026-09-09 11:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 13. FOLLOWED STUDENTS
INSERT INTO public.followed_students (
  id,
  profile_id,
  student_id,
  notification_level,
  created_at
) VALUES
('47000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', '55000000-0000-0000-0000-000000000001', 'all', '2026-09-08 12:00:00+00'),
('47000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000004', '55000000-0000-0000-0000-000000000003', 'important', '2026-09-08 12:10:00+00')
ON CONFLICT (profile_id, student_id) DO NOTHING;


-- 14. ANNOUNCEMENTS
INSERT INTO public.announcements (
  id,
  title,
  body,
  author_id,
  target_type,
  is_pinned,
  requires_acknowledgement,
  push_enabled,
  published_at,
  expires_at,
  created_at,
  updated_at
) VALUES
('88000000-0000-0000-0000-000000000001', 'Welcome to the New School Year', 'Welcome back everyone. Let us make this school year productive and focused.', 'a1000000-0000-4000-8000-000000000001', 'all_staff', true, false, false, '2026-09-01 12:00:00+00', NULL, '2026-09-01 12:00:00+00', '2026-09-01 12:00:00+00'),
('88000000-0000-0000-0000-000000000002', 'Submit Mentor Feedback Report', 'All mentors are required to submit their weekly group summary by Thursday noon.', 'a1000000-0000-4000-8000-000000000002', 'roles', false, true, true, '2026-09-09 07:00:00+00', '2026-09-12 07:00:00+00', '2026-09-09 07:00:00+00', '2026-09-09 07:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 15. ANNOUNCEMENT TARGET ROLES
INSERT INTO public.announcement_target_roles (
  id,
  announcement_id,
  role
) VALUES
('48000000-0000-4000-8000-000000000001', '88000000-0000-0000-0000-000000000002', 'mentor')
ON CONFLICT (announcement_id, role) DO NOTHING;


-- 16. ANNOUNCEMENT READS
INSERT INTO public.announcement_reads (
  id,
  announcement_id,
  profile_id,
  read_at
) VALUES
('49000000-0000-4000-8000-000000000001', '88000000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000003', '2026-09-02 08:00:00+00'),
('49000000-0000-4000-8000-000000000002', '88000000-0000-0000-0000-000000000002', 'a1000000-0000-4000-8000-000000000003', '2026-09-09 10:00:00+00')
ON CONFLICT (announcement_id, profile_id) DO NOTHING;


-- 17. CALENDAR EVENTS (Multi-day Event Included)
INSERT INTO public.calendar_events (
  id,
  school_year_id,
  title,
  description,
  starts_at,
  ends_at,
  is_all_day,
  visibility,
  location,
  color_key,
  created_by,
  updated_by,
  created_at,
  updated_at
) VALUES
('99000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Staff Preparation Seminar', 'Multi-day seminar to prepare for the upcoming school year.', '2026-08-25 09:00:00+03', '2026-08-27 16:00:00+03', false, 'staff_only', 'Main Auditorium', 'blue', 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-08-01 09:00:00+00', '2026-08-01 09:00:00+00'),
('99000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Tenth Grade Family Evening', 'Initial meeting with families of Tenth grade students.', '2026-11-15 16:30:00+03', '2026-11-15 19:30:00+03', false, 'groups', 'Library Hall', 'green', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', '2026-10-01 09:00:00+00', '2026-10-01 09:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 18. CALENDAR EVENT GROUPS
INSERT INTO public.calendar_event_groups (
  id,
  event_id,
  group_id
) VALUES
('4a000000-0000-4000-8000-000000000001', '99000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001')
ON CONFLICT (event_id, group_id) DO NOTHING;


-- 19. WEEKLY LEARNING GROUPS (Within the 11:30 - 13:30 Time Window)
INSERT INTO public.learning_groups (
  id,
  school_year_id,
  title,
  weekday,
  starts_at,
  ends_at,
  leader_id,
  room,
  description,
  active_from,
  active_until,
  is_active,
  created_by,
  updated_by,
  created_at,
  updated_at
) VALUES
('aa100000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Software Development Lab', 'monday', '11:30:00', '13:30:00', 'a1000000-0000-4000-8000-000000000003', 'Room 102', 'Weekly hands-on coding and architecture sessions.', '2026-09-01', '2027-06-30', true, 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 20. LEARNING GROUP TARGET GROUPS
INSERT INTO public.learning_group_target_groups (
  id,
  learning_group_id,
  group_id
) VALUES
('4b000000-0000-4000-8000-000000000001', 'aa100000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001')
ON CONFLICT (learning_group_id, group_id) DO NOTHING;


-- 21. NOTIFICATIONS
INSERT INTO public.notifications (
  id,
  profile_id,
  type,
  title,
  body,
  deep_link,
  read_at,
  sent_at,
  created_at
) VALUES
('4c000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'emotional_status_changed', 'Critical Emotional Status', 'Charlie''s emotional status has been updated to red.', '/students/55000000-0000-0000-0000-000000000003', NULL, '2026-09-09 12:00:00+00', '2026-09-09 12:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 22. STAFF ACCESS GRANTS
INSERT INTO public.staff_access_grants (
  id,
  email,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES
('bb200000-0000-0000-0000-000000000001', 'super.admin@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000002', 'manager.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000003', 'mentor.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000004', 'mentor.two@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000005', 'master.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000006', 'counselor.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000007', 'leadership.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00'),
('bb200000-0000-0000-0000-000000000008', 'staff.one@example.test', true, NULL, '2026-09-01 08:00:00+00', '2026-09-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 23. STAFF ACCESS GRANT ROLES
INSERT INTO public.staff_access_grant_roles (
  id,
  grant_id,
  role,
  created_at
) VALUES
('4d000000-0000-4000-8000-000000000001', 'bb200000-0000-0000-0000-000000000001', 'super_admin', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000002', 'bb200000-0000-0000-0000-000000000001', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000003', 'bb200000-0000-0000-0000-000000000002', 'manager', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000004', 'bb200000-0000-0000-0000-000000000002', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000005', 'bb200000-0000-0000-0000-000000000003', 'mentor', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000006', 'bb200000-0000-0000-0000-000000000003', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000007', 'bb200000-0000-0000-0000-000000000004', 'mentor', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000008', 'bb200000-0000-0000-0000-000000000004', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000009', 'bb200000-0000-0000-0000-000000000005', 'master', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000010', 'bb200000-0000-0000-0000-000000000005', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000011', 'bb200000-0000-0000-0000-000000000006', 'counselor', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000012', 'bb200000-0000-0000-0000-000000000006', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000013', 'bb200000-0000-0000-0000-000000000007', 'leadership', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000014', 'bb200000-0000-0000-0000-000000000007', 'staff', '2026-09-01 08:00:00+00'),
('4d000000-0000-4000-8000-000000000015', 'bb200000-0000-0000-0000-000000000008', 'staff', '2026-09-01 08:00:00+00')
ON CONFLICT (grant_id, role) DO NOTHING;
