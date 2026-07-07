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
  is_current
) VALUES (
  '26000000-0000-0000-0000-000000002026',
  '2026-2027 Academic Year',
  '2026-09-01',
  '2027-06-30',
  true
) ON CONFLICT (id) DO NOTHING;


-- 2. AUTH USERS (Supabase GoTrue Schema)
-- Deterministic IDs and encrypted password hashes (using a standard bcrypt placeholder hash for "password123")
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
('ad100000-0000-0000-0000-000000000001', 'super.admin@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now()),
('ma200000-0000-0000-0000-000000000001', 'manager.one@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now()),
('me300000-0000-0000-0000-000000000001', 'mentor.one@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now()),
('me300000-0000-0000-0000-000000000002', 'mentor.two@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now()),
('ms400000-0000-0000-0000-000000000001', 'master.one@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now()),
('co500000-0000-0000-0000-000000000001', 'counselor.one@example.test', '$2a$10$7h9t1s2B6g98R98kR98kRuG3B1B1B1B1B1B1B1B1B1B1B1B1B1B1B', now(), '{"provider": "email", "providers": ["email"]}', '{}', 'authenticated', 'authenticated', now(), now())
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
('ad100000-0000-0000-0000-000000000001', 'Super Admin User', 'super.admin@example.test', NULL, '+972500000001', true, now(), now()),
('ma200000-0000-0000-0000-000000000001', 'Manager One User', 'manager.one@example.test', NULL, '+972500000002', true, now(), now()),
('me300000-0000-0000-0000-000000000001', 'Mentor One User', 'mentor.one@example.test', NULL, '+972500000003', true, now(), now()),
('me300000-0000-0000-0000-000000000002', 'Mentor Two User', 'mentor.two@example.test', NULL, '+972500000004', true, now(), now()),
('ms400000-0000-0000-0000-000000000001', 'Master One User', 'master.one@example.test', NULL, '+972500000005', true, now(), now()),
('co500000-0000-0000-0000-000000000001', 'Counselor One User', 'counselor.one@example.test', NULL, '+972500000006', true, now(), now())
ON CONFLICT (id) DO NOTHING;


-- 4. PROFILE ROLES
INSERT INTO public.profile_roles (profile_id, role) VALUES
('ad100000-0000-0000-0000-000000000001', 'super_admin'),
('ad100000-0000-0000-0000-000000000001', 'staff'),
('ma200000-0000-0000-0000-000000000001', 'manager'),
('ma200000-0000-0000-0000-000000000001', 'staff'),
('me300000-0000-0000-0000-000000000001', 'mentor'),
('me300000-0000-0000-0000-000000000001', 'staff'),
('me300000-0000-0000-0000-000000000002', 'mentor'),
('me300000-0000-0000-0000-000000000002', 'staff'),
('ms400000-0000-0000-0000-000000000001', 'master'),
('ms400000-0000-0000-0000-000000000001', 'staff'),
('co500000-0000-0000-0000-000000000001', 'counselor'),
('co500000-0000-0000-0000-000000000001', 'staff')
ON CONFLICT (profile_id, role) DO NOTHING;


-- 5. STUDENT GROUPS
INSERT INTO public.student_groups (
  id,
  school_year_id,
  name,
  layer,
  is_active
) VALUES 
('11000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Software Engineers', 'Tenth', true),
('11000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Robotics League', 'Eleventh', true)
ON CONFLICT (id) DO NOTHING;


-- 6. GROUP MENTORS
INSERT INTO public.group_mentors (
  group_id,
  mentor_id,
  is_primary,
  active_from,
  active_until
) VALUES
('11000000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('11000000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000002', false, '2026-09-01', NULL),
('11000000-0000-0000-0000-000000000002', 'me300000-0000-0000-0000-000000000002', true, '2026-09-01', NULL)
ON CONFLICT DO NOTHING;


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
  is_active
) VALUES
('55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Alice', 'Smith', NULL, '+972511111111', '+972511111112', 'Mary Smith', '+972511111113', true),
('55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Bob', 'Johnson', NULL, '+972522222221', NULL, 'Robert Johnson', '+972522222222', true),
('55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000001', 'Charlie', 'Brown', NULL, '+972533333331', NULL, 'Lucy Brown', '+972533333332', true),
('55000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'David', 'Davis', NULL, '+972544444441', NULL, 'Sarah Davis', '+972544444442', true),
('55000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'Eva', 'Green', NULL, '+972555555551', NULL, 'John Green', '+972555555552', true),
('55000000-0000-0000-0000-000000000006', '26000000-0000-0000-0000-000000002026', '11000000-0000-0000-0000-000000000002', 'Frank', 'White', NULL, '+972566666661', NULL, 'Elizabeth White', '+972566666662', true)
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
  updated_by
) VALUES
('77000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Task Manager App', 'A mobile app to keep track of school assignments.', 'green', 'Everything is on schedule.', true, 'ma200000-0000-0000-0000-000000000001', 'ma200000-0000-0000-0000-000000000001'),
('77000000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Local Garden Automation', 'Using sensors to water garden automatically.', 'yellow', 'Waiting for hardware parts to arrive.', true, 'ms400000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001'),
('77000000-0000-0000-0000-000000000003', '55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', 'Smart Garbage Sorter', 'AI camera that sorts trash dynamically.', 'red', 'Struggling with Tensorflow integration.', true, 'ms400000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001'),
('77000000-0000-0000-0000-000000000004', '55000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000002026', 'Self-Balancing Robot', 'A two-wheeled balance robot.', 'green', 'PID controllers configured.', true, 'ms400000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001'),
('77000000-0000-0000-0000-000000000005', '55000000-0000-0000-0000-000000000005', '26000000-0000-0000-0000-000000002026', 'Solar Tracking Panel', 'Panel that moves according to sunlight.', 'green', 'First prototype completed.', true, 'ms400000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001'),
('77000000-0000-0000-0000-000000000006', '55000000-0000-0000-0000-000000000006', '26000000-0000-0000-0000-000000002026', 'Robot Arm Grabber', 'ARM-based robotic arm.', 'yellow', 'Motor power supply issues.', true, 'ms400000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;


-- 9. STUDENT MASTERS
INSERT INTO public.student_masters (
  student_id,
  project_id,
  master_id,
  is_primary,
  active_from,
  active_until
) VALUES
('55000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('55000000-0000-0000-0000-000000000002', '77000000-0000-0000-0000-000000000002', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('55000000-0000-0000-0000-000000000003', '77000000-0000-0000-0000-000000000003', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('55000000-0000-0000-0000-000000000004', '77000000-0000-0000-0000-000000000004', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('55000000-0000-0000-0000-000000000005', '77000000-0000-0000-0000-000000000005', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL),
('55000000-0000-0000-0000-000000000006', '77000000-0000-0000-0000-000000000006', 'ms400000-0000-0000-0000-000000000001', true, '2026-09-01', NULL)
ON CONFLICT DO NOTHING;


-- 10. STUDENT EMOTIONAL STATUSES (History Included)
INSERT INTO public.student_emotional_statuses (
  student_id,
  status,
  note,
  created_by,
  created_at
) VALUES
('55000000-0000-0000-0000-000000000001', 'green', 'Doing great academically and socially.', 'me300000-0000-0000-0000-000000000001', now() - interval '2 days'),
('55000000-0000-0000-0000-000000000002', 'green', 'Happy, participating well.', 'me300000-0000-0000-0000-000000000001', now() - interval '5 days'),
('55000000-0000-0000-0000-000000000002', 'yellow', 'Appears tired and stressed lately.', 'me300000-0000-0000-0000-000000000001', now() - interval '1 day'),
('55000000-0000-0000-0000-000000000003', 'green', 'Initial interview went fine.', 'me300000-0000-0000-0000-000000000001', now() - interval '10 days'),
('55000000-0000-0000-0000-000000000003', 'yellow', 'Complained about workload.', 'me300000-0000-0000-0000-000000000001', now() - interval '5 days'),
('55000000-0000-0000-0000-000000000003', 'red', 'Missing classes, family concerns reported.', 'co500000-0000-0000-0000-000000000001', now() - interval '1 day'),
('55000000-0000-0000-0000-000000000004', 'green', 'Highly engaged and collaborative.', 'me300000-0000-0000-0000-000000000002', now() - interval '4 days'),
('55000000-0000-0000-0000-000000000005', 'green', 'Consistent performer, very communicative.', 'me300000-0000-0000-0000-000000000002', now() - interval '3 days'),
('55000000-0000-0000-0000-000000000006', 'yellow', 'Struggling with time management.', 'me300000-0000-0000-0000-000000000002', now() - interval '2 days')
ON CONFLICT DO NOTHING;


-- 11. STUDENT GOALS
INSERT INTO public.student_goals (
  student_id,
  school_year_id,
  title,
  description,
  status,
  is_primary,
  visible_to_student,
  created_by,
  updated_by
) VALUES
('55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Complete Next.js layout', 'Establish structure and basic routing.', 'completed', false, false, 'me300000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001'),
('55000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Integrate Supabase Auth', 'Google OAuth with domain restrictions.', 'active', true, false, 'me300000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001'),
('55000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Assemble breadboard circuit', 'Wire sensors and check power flow.', 'active', true, false, 'me300000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001'),
('55000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000002026', 'Train basic sorting model', 'Train CNN classifier on trash dataset.', 'paused', false, false, 'me300000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;


-- 12. STUDENT MESSAGES (Staff Notes)
INSERT INTO public.student_messages (
  student_id,
  author_id,
  body,
  tags,
  is_important
) VALUES
('55000000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001', 'Alice completed the first task and is moving very fast.', array['project'::public.student_message_tag], false),
('55000000-0000-0000-0000-000000000003', 'co500000-0000-0000-0000-000000000001', 'Charlie missed three sessions this week. Highly concerned about family issues.', array['attendance'::public.student_message_tag, 'family'::public.student_message_tag], true)
ON CONFLICT DO NOTHING;


-- 13. FOLLOWED STUDENTS
INSERT INTO public.followed_students (
  profile_id,
  student_id,
  notification_level
) VALUES
('me300000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000001', 'all'),
('me300000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000003', 'important')
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
  expires_at
) VALUES
('88000000-0000-0000-0000-000000000001', 'Welcome to the New School Year', 'Welcome back everyone! Lets make this school year productive and amazing.', 'ad100000-0000-0000-0000-000000000001', 'all_staff', true, false, false, now() - interval '2 days', NULL),
('88000000-0000-0000-0000-000000000002', 'Submit Mentor Feedback Report', 'All mentors are required to submit their weekly group summary by Thursday noon.', 'ma200000-0000-0000-0000-000000000001', 'roles', false, true, true, now() - interval '5 hours', now() + interval '3 days')
ON CONFLICT (id) DO NOTHING;


-- 15. ANNOUNCEMENT TARGET ROLES
INSERT INTO public.announcement_target_roles (
  announcement_id,
  role
) VALUES
('88000000-0000-0000-0000-000000000002', 'mentor')
ON CONFLICT (announcement_id, role) DO NOTHING;


-- 16. ANNOUNCEMENT READS
INSERT INTO public.announcement_reads (
  announcement_id,
  profile_id,
  read_at
) VALUES
('88000000-0000-0000-0000-000000000001', 'me300000-0000-0000-0000-000000000001', now() - interval '1 day'),
('88000000-0000-0000-0000-000000000002', 'me300000-0000-0000-0000-000000000001', now() - interval '2 hours')
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
  created_by
) VALUES
('99000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Staff Preparation Seminar', 'Multi-day seminar to prepare for the upcoming school year.', '2026-08-25 09:00:00+03', '2026-08-27 16:00:00+03', false, 'staff_only', 'Main Auditorium', 'blue', 'ad100000-0000-0000-0000-000000000001'),
('99000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000002026', 'Tenth Grade Parents Evening', 'Initial meeting with parents of Tenth graders.', '2026-11-15 16:30:00+03', '2026-11-15 19:30:00+03', false, 'groups', 'Library Hall', 'green', 'ma200000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;


-- 18. CALENDAR EVENT GROUPS
INSERT INTO public.calendar_event_groups (
  event_id,
  group_id
) VALUES
('99000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001')
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
  created_by
) VALUES
('aa100000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000002026', 'Software Development Lab', 'monday', '11:30:00', '13:30:00', 'me300000-0000-0000-0000-000000000001', 'Room 102', 'Weekly hands-on coding and architecture sessions.', '2026-09-01', '2027-06-30', true, 'ma200000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;


-- 20. LEARNING GROUP TARGET GROUPS
INSERT INTO public.learning_group_target_groups (
  learning_group_id,
  group_id
) VALUES
('aa100000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001')
ON CONFLICT (learning_group_id, group_id) DO NOTHING;


-- 21. NOTIFICATIONS
INSERT INTO public.notifications (
  profile_id,
  type,
  title,
  body,
  deep_link,
  read_at,
  sent_at
) VALUES
('me300000-0000-0000-0000-000000000001', 'emotional_status_changed', 'Critical Emotional Status', 'Charlies emotional status has been updated to RED.', '/students/55000000-0000-0000-0000-000000000003', NULL, now() - interval '1 hour')
ON CONFLICT DO NOTHING;


-- 22. STAFF ACCESS GRANTS
INSERT INTO public.staff_access_grants (
  id,
  email,
  is_active,
  created_by
) VALUES
('bb200000-0000-0000-0000-000000000001', 'super.admin@example.test', true, NULL),
('bb200000-0000-0000-0000-000000000002', 'manager.one@example.test', true, NULL),
('bb200000-0000-0000-0000-000000000003', 'mentor.one@example.test', true, NULL),
('bb200000-0000-0000-0000-000000000004', 'mentor.two@example.test', true, NULL),
('bb200000-0000-0000-0000-000000000005', 'master.one@example.test', true, NULL),
('bb200000-0000-0000-0000-000000000006', 'counselor.one@example.test', true, NULL)
ON CONFLICT (id) DO NOTHING;


-- 23. STAFF ACCESS GRANT ROLES
INSERT INTO public.staff_access_grant_roles (
  grant_id,
  role
) VALUES
('bb200000-0000-0000-0000-000000000001', 'super_admin'),
('bb200000-0000-0000-0000-000000000001', 'staff'),
('bb200000-0000-0000-0000-000000000002', 'manager'),
('bb200000-0000-0000-0000-000000000002', 'staff'),
('bb200000-0000-0000-0000-000000000003', 'mentor'),
('bb200000-0000-0000-0000-000000000003', 'staff'),
('bb200000-0000-0000-0000-000000000004', 'mentor'),
('bb200000-0000-0000-0000-000000000004', 'staff'),
('bb200000-0000-0000-0000-000000000005', 'master'),
('bb200000-0000-0000-0000-000000000005', 'staff'),
('bb200000-0000-0000-0000-000000000006', 'counselor'),
('bb200000-0000-0000-0000-000000000006', 'staff')
ON CONFLICT (grant_id, role) DO NOTHING;
