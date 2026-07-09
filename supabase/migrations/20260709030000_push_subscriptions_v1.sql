alter table public.push_subscriptions
  add column if not exists expiration_time timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using (
    profile_id = auth.uid()
    and public.current_user_is_active_staff()
  )
  with check (
    profile_id = auth.uid()
    and public.current_user_is_active_staff()
  );
