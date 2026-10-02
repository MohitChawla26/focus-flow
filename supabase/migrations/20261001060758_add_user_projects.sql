create table public.user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  details text not null default '' check (char_length(details) <= 5000),
  priority public.priority_level not null default 'medium',
  deadline timestamptz,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_projects_user_deadline_idx
  on public.user_projects(user_id, deadline asc nulls last);

create trigger user_projects_updated
  before update on public.user_projects
  for each row execute function public.set_updated_at();

alter table public.user_projects enable row level security;

revoke all on table public.user_projects from anon, authenticated;
grant select, insert, update, delete on table public.user_projects to authenticated;

create policy projects_select_own on public.user_projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy projects_insert_own on public.user_projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy projects_update_own on public.user_projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy projects_delete_own on public.user_projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);
