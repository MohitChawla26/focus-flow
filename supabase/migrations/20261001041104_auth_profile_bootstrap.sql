create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, ''), '@', 1), '')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select id, coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(email, ''), '@', 1), '')
from auth.users
on conflict (id) do nothing;

insert into public.user_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

drop policy if exists profiles_own on public.profiles;
drop policy if exists interests_own on public.user_interests;
drop policy if exists keywords_own on public.user_keywords;
drop policy if exists people_own on public.important_people;
drop policy if exists preferences_own on public.user_preferences;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy interests_select_own on public.user_interests for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy interests_insert_own on public.user_interests for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy interests_update_own on public.user_interests for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy interests_delete_own on public.user_interests for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy keywords_select_own on public.user_keywords for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy keywords_insert_own on public.user_keywords for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy keywords_update_own on public.user_keywords for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy keywords_delete_own on public.user_keywords for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy people_select_own on public.important_people for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy people_insert_own on public.important_people for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy people_update_own on public.important_people for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy people_delete_own on public.important_people for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy preferences_select_own on public.user_preferences for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy preferences_insert_own on public.user_preferences for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy preferences_update_own on public.user_preferences for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy preferences_delete_own on public.user_preferences for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on public.profiles, public.user_interests, public.user_keywords, public.important_people, public.user_preferences from anon;
grant select, insert, update, delete on public.profiles, public.user_interests, public.user_keywords, public.important_people, public.user_preferences to authenticated;
