create table public.staff_access_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_access_grants_email_lowercase check (email = lower(email))
);

create index staff_access_grants_email_lower_idx
  on public.staff_access_grants (lower(email));
create index staff_access_grants_is_active_idx
  on public.staff_access_grants (is_active);

create table public.staff_access_grant_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  grant_id uuid not null references public.staff_access_grants(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint staff_access_grant_roles_grant_role_key unique (grant_id, role)
);

create index staff_access_grant_roles_grant_id_idx
  on public.staff_access_grant_roles (grant_id);
create index staff_access_grant_roles_role_idx
  on public.staff_access_grant_roles (role);

create trigger set_staff_access_grants_updated_at
  before update on public.staff_access_grants
  for each row execute function public.set_updated_at();

alter table public.staff_access_grants enable row level security;
alter table public.staff_access_grant_roles enable row level security;

create policy "Super admins can manage staff access grants"
  on public.staff_access_grants for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

create policy "Super admins can manage staff access grant roles"
  on public.staff_access_grant_roles for all to authenticated
  using (public.current_user_is_super_admin())
  with check (public.current_user_is_super_admin());

revoke all privileges on public.staff_access_grants from anon;
revoke all privileges on public.staff_access_grant_roles from anon;

grant select, insert, update, delete on public.staff_access_grants to authenticated;
grant select, insert, update, delete on public.staff_access_grant_roles to authenticated;
