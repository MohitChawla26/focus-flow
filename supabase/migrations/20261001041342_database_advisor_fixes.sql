create index bookmarks_content_item_idx on public.bookmarks(content_item_id);
create index cluster_members_content_item_idx on public.cluster_members(content_item_id);
create index content_clusters_primary_item_idx on public.content_clusters(primary_content_item_id);
create index content_items_source_idx on public.content_items(source_id);
create index content_items_user_idx on public.content_items(user_id);
create index digest_items_content_item_idx on public.digest_items(content_item_id);
create index notifications_content_item_idx on public.notifications(content_item_id);
create index read_status_content_item_idx on public.read_status(content_item_id);
create index source_fetch_logs_source_idx on public.source_fetch_logs(source_id);

drop policy if exists sources_write on public.content_sources;
create policy sources_insert_own on public.content_sources for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy sources_update_own on public.content_sources for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy sources_delete_own on public.content_sources for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists items_write on public.content_items;
create policy items_insert_own on public.content_items for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy items_update_own on public.content_items for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy items_delete_own on public.content_items for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists clusters_write on public.content_clusters;
create policy clusters_insert_own on public.content_clusters for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy clusters_update_own on public.content_clusters for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy clusters_delete_own on public.content_clusters for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy source_fetch_logs_read_own on public.source_fetch_logs for select to authenticated
using (
  exists (
    select 1 from public.content_sources source
    where source.id = source_id
      and source.user_id = (select auth.uid())
  )
);

grant select on public.source_fetch_logs to authenticated;
