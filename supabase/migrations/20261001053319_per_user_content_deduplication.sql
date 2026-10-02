-- Private feed items can reuse a public URL across accounts, while remaining
-- unique within each account. Global content (user_id is null) stays unique.
drop index if exists public.content_items_source_external_uidx;
drop index if exists public.content_items_url_uidx;

create unique index content_items_user_source_external_uidx
  on public.content_items(user_id, source, external_id)
  where user_id is not null and external_id is not null;

create unique index content_items_global_source_external_uidx
  on public.content_items(source, external_id)
  where user_id is null and external_id is not null;

create unique index content_items_user_url_uidx
  on public.content_items(user_id, original_url)
  where user_id is not null and original_url is not null;

create unique index content_items_global_url_uidx
  on public.content_items(original_url)
  where user_id is null and original_url is not null;
