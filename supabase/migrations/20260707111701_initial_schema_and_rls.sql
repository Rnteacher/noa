create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'staff',
  'mentor',
  'master',
  'counselor',
  'leadership',
  'manager',
  'super_admin'
);

create type public.traffic_light_status as enum (
  'green',
  'yellow',
  'red'
);

create type public.goal_status as enum (
  'active',
  'completed',
  'paused',
  'archived'
);

create type public.student_message_tag as enum (
  'general',
  'project',
  'emotional',
  'attendance',
  'family',
  'incident'
);

create type public.announcement_target_type as enum (
  'all_staff',
  'roles',
  'groups',
  'users'
);

create type public.event_visibility as enum (
  'all_school',
  'groups',
  'staff_only',
  'leadership_only'
);

create type public.weekday as enum (
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
);

create table public.school_years (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_years_date_order check (ends_on > starts_on)
);

create unique index school_years_one_current_idx
  on public.school_years (is_current)
  where is_current = true;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_is_active_idx on public.profiles (is_active);
create index profiles_email_lower_idx on public.profiles (lower(email));

create table public.profile_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint profile_roles_profile_role_key unique (profile_id, role)
);

create index profile_roles_profile_id_idx on public.profile_roles (profile_id);
create index profile_roles_role_idx on public.profile_roles (role);

create table public.student_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  name text not null,
  layer text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_groups_school_year_id_idx on public.student_groups (school_year_id);
create index student_groups_is_active_idx on public.student_groups (is_active);
create unique index student_groups_school_year_name_idx on public.student_groups (school_year_id, name);

create table public.group_mentors (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.student_groups(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete restrict,
  is_primary boolean not null default false,
  active_from date not null,
  active_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_mentors_active_range check (
    active_until is null or active_until >= active_from
  )
);

create index group_mentors_group_id_idx on public.group_mentors (group_id);
create index group_mentors_mentor_id_idx on public.group_mentors (mentor_id);
create index group_mentors_active_assignments_idx
  on public.group_mentors (group_id, mentor_id)
  where active_until is null;
create unique index group_mentors_one_active_primary_idx
  on public.group_mentors (group_id)
  where is_primary = true and active_until is null;

create table public.students (
  id uuid primary key default extensions.gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  group_id uuid not null references public.student_groups(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  photo_url text,
  primary_phone text,
  secondary_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_school_year_id_idx on public.students (school_year_id);
create index students_group_id_idx on public.students (group_id);
create index students_is_active_idx on public.students (is_active);
create index students_name_lower_idx on public.students (lower(first_name), lower(last_name));
create index students_full_name_lower_idx
  on public.students (lower(first_name || ' ' || last_name));

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  title text not null,
  description text,
  status public.traffic_light_status not null default 'green',
  status_note text,
  is_current boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_student_id_idx on public.projects (student_id);
create index projects_school_year_id_idx on public.projects (school_year_id);
create index projects_status_idx on public.projects (status);
create unique index projects_one_current_per_student_idx
  on public.projects (student_id)
  where is_current = true;

create table public.student_masters (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  master_id uuid not null references public.profiles(id) on delete restrict,
  is_primary boolean not null default false,
  active_from date not null,
  active_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_masters_active_range check (
    active_until is null or active_until >= active_from
  )
);

create index student_masters_student_id_idx on public.student_masters (student_id);
create index student_masters_project_id_idx on public.student_masters (project_id);
create index student_masters_master_id_idx on public.student_masters (master_id);
create index student_masters_active_assignments_idx
  on public.student_masters (student_id, master_id)
  where active_until is null;

create table public.student_emotional_statuses (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  status public.traffic_light_status not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index student_emotional_statuses_student_id_idx
  on public.student_emotional_statuses (student_id);
create index student_emotional_statuses_created_at_desc_idx
  on public.student_emotional_statuses (created_at desc);
create index student_emotional_statuses_student_created_at_desc_idx
  on public.student_emotional_statuses (student_id, created_at desc);

create table public.student_goals (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  title text not null,
  description text,
  status public.goal_status not null default 'active',
  is_primary boolean not null default false,
  visible_to_student boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_goals_student_id_idx on public.student_goals (student_id);
create index student_goals_school_year_id_idx on public.student_goals (school_year_id);
create index student_goals_status_idx on public.student_goals (status);
create index student_goals_visible_to_student_idx on public.student_goals (visible_to_student);

create table public.student_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  tags public.student_message_tag[] not null default array['general'::public.student_message_tag],
  is_important boolean not null default false,
  parent_message_id uuid references public.student_messages(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_messages_student_id_idx on public.student_messages (student_id);
create index student_messages_author_id_idx on public.student_messages (author_id);
create index student_messages_created_at_desc_idx on public.student_messages (created_at desc);
create index student_messages_active_idx
  on public.student_messages (student_id, created_at desc)
  where deleted_at is null;

create table public.followed_students (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  notification_level text not null default 'all',
  created_at timestamptz not null default now(),
  constraint followed_students_profile_student_key unique (profile_id, student_id),
  constraint followed_students_notification_level_check check (
    notification_level in ('all', 'important', 'muted')
  )
);

create index followed_students_profile_id_idx on public.followed_students (profile_id);
create index followed_students_student_id_idx on public.followed_students (student_id);

create table public.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete set null,
  target_type public.announcement_target_type not null default 'all_staff',
  is_pinned boolean not null default false,
  requires_acknowledgement boolean not null default false,
  push_enabled boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_expiry_after_publish check (
    expires_at is null or expires_at > published_at
  )
);

create index announcements_author_id_idx on public.announcements (author_id);
create index announcements_target_type_idx on public.announcements (target_type);
create index announcements_published_at_desc_idx on public.announcements (published_at desc);
create index announcements_expires_at_idx on public.announcements (expires_at);

create table public.announcement_target_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  role public.app_role not null,
  constraint announcement_target_roles_announcement_role_key unique (announcement_id, role)
);

create index announcement_target_roles_announcement_id_idx
  on public.announcement_target_roles (announcement_id);
create index announcement_target_roles_role_idx on public.announcement_target_roles (role);

create table public.announcement_target_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  constraint announcement_target_groups_announcement_group_key unique (announcement_id, group_id)
);

create index announcement_target_groups_announcement_id_idx
  on public.announcement_target_groups (announcement_id);
create index announcement_target_groups_group_id_idx on public.announcement_target_groups (group_id);

create table public.announcement_target_users (
  id uuid primary key default extensions.gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  constraint announcement_target_users_announcement_profile_key unique (announcement_id, profile_id)
);

create index announcement_target_users_announcement_id_idx
  on public.announcement_target_users (announcement_id);
create index announcement_target_users_profile_id_idx on public.announcement_target_users (profile_id);

create table public.announcement_reads (
  id uuid primary key default extensions.gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint announcement_reads_announcement_profile_key unique (announcement_id, profile_id)
);

create index announcement_reads_announcement_id_idx on public.announcement_reads (announcement_id);
create index announcement_reads_profile_id_idx on public.announcement_reads (profile_id);

create table public.calendar_events (
  id uuid primary key default extensions.gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  recurrence_rule text,
  visibility public.event_visibility not null default 'all_school',
  location text,
  color_key text,
  push_enabled boolean not null default false,
  google_calendar_event_id text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_time_order check (ends_at > starts_at)
);

create index calendar_events_school_year_id_idx on public.calendar_events (school_year_id);
create index calendar_events_starts_at_idx on public.calendar_events (starts_at);
create index calendar_events_ends_at_idx on public.calendar_events (ends_at);
create index calendar_events_google_calendar_event_id_idx
  on public.calendar_events (google_calendar_event_id);
create index calendar_events_visibility_idx on public.calendar_events (visibility);

create table public.calendar_event_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  constraint calendar_event_groups_event_group_key unique (event_id, group_id)
);

create index calendar_event_groups_event_id_idx on public.calendar_event_groups (event_id);
create index calendar_event_groups_group_id_idx on public.calendar_event_groups (group_id);

create table public.learning_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete restrict,
  title text not null,
  weekday public.weekday not null,
  starts_at time not null,
  ends_at time not null,
  leader_id uuid references public.profiles(id) on delete set null,
  room text,
  description text,
  active_from date not null,
  active_until date,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_groups_time_order check (ends_at > starts_at),
  constraint learning_groups_active_range check (
    active_until is null or active_until >= active_from
  ),
  constraint learning_groups_standard_window check (
    starts_at >= time '11:30:00' and ends_at <= time '13:30:00'
  )
);

create index learning_groups_school_year_id_idx on public.learning_groups (school_year_id);
create index learning_groups_weekday_idx on public.learning_groups (weekday);
create index learning_groups_is_active_idx on public.learning_groups (is_active);
create index learning_groups_leader_id_idx on public.learning_groups (leader_id);

create table public.learning_group_target_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  learning_group_id uuid not null references public.learning_groups(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  constraint learning_group_target_groups_learning_group_group_key unique (
    learning_group_id,
    group_id
  )
);

create index learning_group_target_groups_learning_group_id_idx
  on public.learning_group_target_groups (learning_group_id);
create index learning_group_target_groups_group_id_idx
  on public.learning_group_target_groups (group_id);

create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  device_label text,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index push_subscriptions_profile_id_idx on public.push_subscriptions (profile_id);
create index push_subscriptions_is_active_idx on public.push_subscriptions (is_active);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  deep_link text,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_id_idx on public.notifications (profile_id);
create index notifications_created_at_desc_idx on public.notifications (created_at desc);
create index notifications_unread_idx
  on public.notifications (profile_id, created_at desc)
  where read_at is null;

create table public.webhook_endpoints (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  url text not null,
  secret text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webhook_endpoints_is_active_idx on public.webhook_endpoints (is_active);

create table public.webhook_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  webhook_endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  constraint webhook_deliveries_attempt_count_nonnegative check (attempt_count >= 0)
);

create index webhook_deliveries_webhook_endpoint_id_idx
  on public.webhook_deliveries (webhook_endpoint_id);
create index webhook_deliveries_status_idx on public.webhook_deliveries (status);
create index webhook_deliveries_created_at_desc_idx on public.webhook_deliveries (created_at desc);

create table public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_desc_idx on public.audit_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_school_years_updated_at
  before update on public.school_years
  for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_student_groups_updated_at
  before update on public.student_groups
  for each row execute function public.set_updated_at();

create trigger set_group_mentors_updated_at
  before update on public.group_mentors
  for each row execute function public.set_updated_at();

create trigger set_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_student_masters_updated_at
  before update on public.student_masters
  for each row execute function public.set_updated_at();

create trigger set_student_goals_updated_at
  before update on public.student_goals
  for each row execute function public.set_updated_at();

create trigger set_student_messages_updated_at
  before update on public.student_messages
  for each row execute function public.set_updated_at();

create trigger set_announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create trigger set_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

create trigger set_learning_groups_updated_at
  before update on public.learning_groups
  for each row execute function public.set_updated_at();

create trigger set_webhook_endpoints_updated_at
  before update on public.webhook_endpoints
  for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function public.current_user_has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_roles pr on pr.profile_id = p.id
    where p.id = auth.uid()
      and p.is_active = true
      and pr.role = required_role
  );
$$;

create or replace function public.current_user_has_any_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_roles pr on pr.profile_id = p.id
    where p.id = auth.uid()
      and p.is_active = true
      and pr.role = any(required_roles)
  );
$$;

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_role('super_admin'::public.app_role);
$$;

create or replace function public.current_user_is_manager_or_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_any_role(
    array['manager'::public.app_role, 'super_admin'::public.app_role]
  );
$$;

create or replace function public.current_user_is_leadership_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_any_role(
    array[
      'leadership'::public.app_role,
      'manager'::public.app_role,
      'super_admin'::public.app_role
    ]
  );
$$;

create or replace function public.current_user_is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_roles pr on pr.profile_id = p.id
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.current_user_is_group_mentor(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_mentors gm
    where gm.group_id = target_group_id
      and gm.mentor_id = auth.uid()
      and gm.active_from <= current_date
      and (gm.active_until is null or gm.active_until >= current_date)
  );
$$;

create or replace function public.current_user_is_group_master(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.student_masters sm on sm.student_id = s.id
    where s.group_id = target_group_id
      and sm.master_id = auth.uid()
      and sm.active_from <= current_date
      and (sm.active_until is null or sm.active_until >= current_date)
  );
$$;

create or replace function public.current_user_is_student_mentor(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.group_mentors gm on gm.group_id = s.group_id
    where s.id = target_student_id
      and gm.mentor_id = auth.uid()
      and gm.active_from <= current_date
      and (gm.active_until is null or gm.active_until >= current_date)
  );
$$;

create or replace function public.current_user_is_student_master(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_masters sm
    where sm.student_id = target_student_id
      and sm.master_id = auth.uid()
      and sm.active_from <= current_date
      and (sm.active_until is null or sm.active_until >= current_date)
  );
$$;

create or replace function public.current_user_can_update_student_project(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_manager_or_super_admin()
    or public.current_user_is_student_master(target_student_id);
$$;

create or replace function public.current_user_can_update_student_emotional_status(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_manager_or_super_admin()
    or public.current_user_has_role('counselor'::public.app_role)
    or public.current_user_is_student_mentor(target_student_id);
$$;

create or replace function public.current_user_can_update_student_goals(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_manager_or_super_admin()
    or public.current_user_is_student_mentor(target_student_id);
$$;

create or replace function public.current_user_can_manage_student_photo(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_manager_or_super_admin()
    or public.current_user_is_student_mentor(target_student_id);
$$;

create or replace function public.current_user_can_read_announcement(target_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_active_staff()
    and exists (
      select 1
      from public.announcements a
      where a.id = target_announcement_id
        and (a.expires_at is null or a.expires_at > now())
        and (
          a.target_type = 'all_staff'::public.announcement_target_type
          or exists (
            select 1
            from public.announcement_target_users atu
            where atu.announcement_id = a.id
              and atu.profile_id = auth.uid()
          )
          or exists (
            select 1
            from public.announcement_target_roles atr
            join public.profile_roles pr on pr.role = atr.role
            where atr.announcement_id = a.id
              and pr.profile_id = auth.uid()
          )
          or exists (
            select 1
            from public.announcement_target_groups atg
            where atg.announcement_id = a.id
              and (
                public.current_user_is_group_mentor(atg.group_id)
                or public.current_user_is_group_master(atg.group_id)
                or public.current_user_is_leadership_or_above()
              )
          )
        )
    );
$$;

create or replace function public.current_user_can_read_calendar_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_active_staff()
    and exists (
      select 1
      from public.calendar_events e
      where e.id = target_event_id
        and (
          e.visibility in (
            'all_school'::public.event_visibility,
            'staff_only'::public.event_visibility
          )
          or (
            e.visibility = 'leadership_only'::public.event_visibility
            and public.current_user_is_leadership_or_above()
          )
          or (
            e.visibility = 'groups'::public.event_visibility
            and exists (
              select 1
              from public.calendar_event_groups ceg
              where ceg.event_id = e.id
                and (
                  public.current_user_is_group_mentor(ceg.group_id)
                  or public.current_user_is_group_master(ceg.group_id)
                  or public.current_user_is_leadership_or_above()
                )
            )
          )
        )
    );
$$;

create view public.current_student_project_statuses
with (security_invoker = true) as
select distinct on (p.student_id)
  p.student_id,
  p.id as project_id,
  p.school_year_id,
  p.title,
  p.status,
  p.status_note,
  p.updated_at
from public.projects p
where p.is_current = true
order by p.student_id, p.updated_at desc, p.created_at desc;

create view public.latest_student_emotional_statuses
with (security_invoker = true) as
select distinct on (ses.student_id)
  ses.student_id,
  ses.id as emotional_status_id,
  ses.status,
  ses.note,
  ses.created_by,
  ses.created_at
from public.student_emotional_statuses ses
order by ses.student_id, ses.created_at desc;

alter table public.school_years enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.student_groups enable row level security;
alter table public.group_mentors enable row level security;
alter table public.students enable row level security;
alter table public.projects enable row level security;
alter table public.student_masters enable row level security;
alter table public.student_emotional_statuses enable row level security;
alter table public.student_goals enable row level security;
alter table public.student_messages enable row level security;
alter table public.followed_students enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_target_roles enable row level security;
alter table public.announcement_target_groups enable row level security;
alter table public.announcement_target_users enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_event_groups enable row level security;
alter table public.learning_groups enable row level security;
alter table public.learning_group_target_groups enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.audit_logs enable row level security;

create policy "Active staff can read school years"
  on public.school_years for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage school years"
  on public.school_years for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read profiles"
  on public.profiles for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read profile roles"
  on public.profile_roles for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage profile roles"
  on public.profile_roles for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read student groups"
  on public.student_groups for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage student groups"
  on public.student_groups for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read group mentors"
  on public.group_mentors for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage group mentors"
  on public.group_mentors for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read students"
  on public.students for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can insert students"
  on public.students for insert to authenticated
  with check (public.current_user_is_super_admin());

create policy "Managers and super admins can update students"
  on public.students for update to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

create policy "Super admins can delete students"
  on public.students for delete to authenticated
  using (public.current_user_is_super_admin());

create policy "Active staff can read projects"
  on public.projects for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Managers and super admins can insert projects"
  on public.projects for insert to authenticated
  with check (public.current_user_is_manager_or_super_admin());

create policy "Masters managers and super admins can update projects"
  on public.projects for update to authenticated
  using (public.current_user_can_update_student_project(student_id))
  with check (public.current_user_can_update_student_project(student_id));

create policy "Managers and super admins can delete projects"
  on public.projects for delete to authenticated
  using (public.current_user_is_manager_or_super_admin());

create policy "Active staff can read student masters"
  on public.student_masters for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Super admins can manage student masters"
  on public.student_masters for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Active staff can read emotional statuses"
  on public.student_emotional_statuses for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Authorized staff can insert emotional statuses"
  on public.student_emotional_statuses for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.current_user_can_update_student_emotional_status(student_id)
  );

create policy "Active staff can read student goals"
  on public.student_goals for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Authorized staff can insert student goals"
  on public.student_goals for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.current_user_can_update_student_goals(student_id)
  );

create policy "Authorized staff can update student goals"
  on public.student_goals for update to authenticated
  using (public.current_user_can_update_student_goals(student_id))
  with check (
    updated_by = auth.uid()
    and public.current_user_can_update_student_goals(student_id)
  );

create policy "Managers and super admins can delete student goals"
  on public.student_goals for delete to authenticated
  using (public.current_user_is_manager_or_super_admin());

create policy "Active staff can read active student messages"
  on public.student_messages for select to authenticated
  using (
    public.current_user_is_active_staff()
    and deleted_at is null
  );

create policy "Super admins can read all student messages"
  on public.student_messages for select to authenticated
  using (public.current_user_is_super_admin());

create policy "Active staff can insert student messages"
  on public.student_messages for insert to authenticated
  with check (
    public.current_user_is_active_staff()
    and author_id = auth.uid()
    and deleted_at is null
    and deleted_by is null
  );

create policy "Authors and super admins can soft delete student messages"
  on public.student_messages for update to authenticated
  using (
    public.current_user_is_super_admin()
    or author_id = auth.uid()
  )
  with check (
    deleted_at is not null
    and (
      public.current_user_is_super_admin()
      or deleted_by = auth.uid()
    )
  );

create policy "Users can read followed students"
  on public.followed_students for select to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert followed students"
  on public.followed_students for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_user_is_active_staff()
  );

create policy "Users can update followed students"
  on public.followed_students for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Users can delete followed students"
  on public.followed_students for delete to authenticated
  using (profile_id = auth.uid());

create policy "Relevant staff can read announcements"
  on public.announcements for select to authenticated
  using (public.current_user_can_read_announcement(id));

create policy "Leadership and above can insert announcements"
  on public.announcements for insert to authenticated
  with check (
    public.current_user_is_leadership_or_above()
    and author_id = auth.uid()
  );

create policy "Leadership can update own announcements"
  on public.announcements for update to authenticated
  using (
    public.current_user_is_manager_or_super_admin()
    or (
      public.current_user_has_role('leadership'::public.app_role)
      and author_id = auth.uid()
    )
  )
  with check (
    public.current_user_is_manager_or_super_admin()
    or (
      public.current_user_has_role('leadership'::public.app_role)
      and author_id = auth.uid()
    )
  );

create policy "Managers and super admins can delete announcements"
  on public.announcements for delete to authenticated
  using (public.current_user_is_manager_or_super_admin());

create policy "Relevant staff can read announcement target roles"
  on public.announcement_target_roles for select to authenticated
  using (public.current_user_can_read_announcement(announcement_id));

create policy "Leadership and above can manage announcement target roles"
  on public.announcement_target_roles for all to authenticated
  using (public.current_user_is_leadership_or_above())
  with check (public.current_user_is_leadership_or_above());

create policy "Relevant staff can read announcement target groups"
  on public.announcement_target_groups for select to authenticated
  using (public.current_user_can_read_announcement(announcement_id));

create policy "Leadership and above can manage announcement target groups"
  on public.announcement_target_groups for all to authenticated
  using (public.current_user_is_leadership_or_above())
  with check (public.current_user_is_leadership_or_above());

create policy "Relevant staff can read announcement target users"
  on public.announcement_target_users for select to authenticated
  using (public.current_user_can_read_announcement(announcement_id));

create policy "Leadership and above can manage announcement target users"
  on public.announcement_target_users for all to authenticated
  using (public.current_user_is_leadership_or_above())
  with check (public.current_user_is_leadership_or_above());

create policy "Users can read own announcement reads"
  on public.announcement_reads for select to authenticated
  using (
    profile_id = auth.uid()
    or public.current_user_is_manager_or_super_admin()
  );

create policy "Users can insert own announcement reads"
  on public.announcement_reads for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_user_can_read_announcement(announcement_id)
  );

create policy "Relevant staff can read calendar events"
  on public.calendar_events for select to authenticated
  using (public.current_user_can_read_calendar_event(id));

create policy "Managers and super admins can insert calendar events"
  on public.calendar_events for insert to authenticated
  with check (
    public.current_user_is_manager_or_super_admin()
    and created_by = auth.uid()
  );

create policy "Managers and super admins can update calendar events"
  on public.calendar_events for update to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

create policy "Managers and super admins can delete calendar events"
  on public.calendar_events for delete to authenticated
  using (public.current_user_is_manager_or_super_admin());

create policy "Relevant staff can read calendar event groups"
  on public.calendar_event_groups for select to authenticated
  using (public.current_user_can_read_calendar_event(event_id));

create policy "Managers and super admins can manage calendar event groups"
  on public.calendar_event_groups for all to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

create policy "Active staff can read learning groups"
  on public.learning_groups for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Managers and super admins can manage learning groups"
  on public.learning_groups for all to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

create policy "Active staff can read learning group target groups"
  on public.learning_group_target_groups for select to authenticated
  using (public.current_user_is_active_staff());

create policy "Managers and super admins can manage learning group target groups"
  on public.learning_group_target_groups for all to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_user_is_active_staff()
  );

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete to authenticated
  using (profile_id = auth.uid());

create policy "Users can read own notifications"
  on public.notifications for select to authenticated
  using (profile_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Super admins can manage webhook endpoints"
  on public.webhook_endpoints for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Managers and super admins can read webhook deliveries"
  on public.webhook_deliveries for select to authenticated
  using (public.current_user_is_manager_or_super_admin());

create policy "Super admins can manage webhook deliveries"
  on public.webhook_deliveries for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Managers and super admins can read audit logs"
  on public.audit_logs for select to authenticated
  using (public.current_user_is_manager_or_super_admin());

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all functions in schema public from anon;
revoke all privileges on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant usage on type public.app_role to authenticated;
grant usage on type public.traffic_light_status to authenticated;
grant usage on type public.goal_status to authenticated;
grant usage on type public.student_message_tag to authenticated;
grant usage on type public.announcement_target_type to authenticated;
grant usage on type public.event_visibility to authenticated;
grant usage on type public.weekday to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
