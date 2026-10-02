create extension if not exists vector with schema extensions;

create type public.source_type as enum ('news','technology','research','youtube','sports','social','rss','college','weather');
create type public.priority_level as enum ('low','medium','high');
create type public.digest_frequency as enum ('morning','evening','every_x_hours','manual');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '', avatar_url text, onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_interests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null, priority public.priority_level not null default 'medium', weight smallint not null default 50 check(weight between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,topic)
);
create table public.user_keywords (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null, weight smallint not null default 75 check(weight between 0 and 100), created_at timestamptz not null default now(), unique(user_id,keyword)
);
create table public.important_people (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, sender_identifier text, weight smallint not null default 80 check(weight between 0 and 100), created_at timestamptz not null default now(), unique(user_id,name)
);
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quiet_hours_enabled boolean not null default true, quiet_start time not null default '22:00', quiet_end time not null default '07:00',
  timezone text not null default 'Asia/Calcutta', notification_threshold smallint not null default 85 check(notification_threshold between 0 and 100),
  digest_frequency public.digest_frequency not null default 'morning', digest_every_hours smallint check(digest_every_hours between 1 and 24),
  cluster_similarity_threshold numeric(4,3) not null default .820 check(cluster_similarity_threshold between 0 and 1),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.content_sources (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, adapter_key text not null, source_type public.source_type not null, feed_url text, category text,
  enabled boolean not null default true, is_global boolean not null default false, config jsonb not null default '{}'::jsonb,
  last_fetched_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,adapter_key,feed_url)
);
create table public.content_items (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  source_id uuid references public.content_sources(id) on delete set null, external_id text, title text not null, content text, description text,
  source text not null, source_type public.source_type not null, original_url text, image_url text, author text, published_at timestamptz,
  raw_data jsonb, content_hash text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index content_items_source_external_uidx on public.content_items(source,external_id) where external_id is not null;
create unique index content_items_url_uidx on public.content_items(original_url) where original_url is not null;
create index content_items_published_idx on public.content_items(published_at desc);
create index content_items_type_idx on public.content_items(source_type);
create index content_items_search_idx on public.content_items using gin(to_tsvector('english',coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(content,'')));
create table public.content_analysis (
  id uuid primary key default gen_random_uuid(), content_item_id uuid not null unique references public.content_items(id) on delete cascade,
  summary text not null, category text not null, urgency smallint not null check(urgency between 0 and 100), keywords text[] not null default '{}', people text[] not null default '{}', organizations text[] not null default '{}',
  deadline timestamptz, event_name text, action_required boolean not null default false, suggested_priority_reason text,
  model text, raw_response jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index content_analysis_keywords_idx on public.content_analysis using gin(keywords);
create table public.content_embeddings (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  embedding extensions.vector(768) not null, model text not null, created_at timestamptz not null default now()
);
create index content_embeddings_hnsw_idx on public.content_embeddings using hnsw (embedding extensions.vector_cosine_ops);
create table public.content_clusters (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  title text not null, combined_summary text, primary_content_item_id uuid references public.content_items(id) on delete set null,
  source_count integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cluster_members (
  cluster_id uuid not null references public.content_clusters(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  similarity numeric(5,4), added_at timestamptz not null default now(), primary key(cluster_id,content_item_id)
);
create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade, content_item_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,content_item_id)
);
create table public.read_status (
  user_id uuid not null references auth.users(id) on delete cascade, content_item_id uuid not null references public.content_items(id) on delete cascade,
  read_at timestamptz, hidden_at timestamptz, deprioritized boolean not null default false, updated_at timestamptz not null default now(), primary key(user_id,content_item_id)
);
create table public.digests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null, period_end timestamptz not null, raw_item_count integer not null default 0, must_know_count integer not null default 0,
  worth_knowing_count integer not null default 0, handled_count integer not null default 0, estimated_reading_minutes integer not null default 0,
  minutes_saved integer not null default 0, summary text, created_at timestamptz not null default now()
);
create table public.digest_items (
  digest_id uuid not null references public.digests(id) on delete cascade, content_item_id uuid not null references public.content_items(id) on delete cascade,
  section text not null check(section in ('must_know','worth_knowing','everything_else')), position integer not null default 0, score numeric(5,2) not null,
  created_at timestamptz not null default now(), primary key(digest_id,content_item_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade, title text not null, body text not null, score numeric(5,2),
  status text not null default 'pending' check(status in ('pending','sent','read','suppressed','failed')), scheduled_for timestamptz, sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.source_fetch_logs (
  id bigint generated always as identity primary key, source_id uuid references public.content_sources(id) on delete set null,
  status text not null check(status in ('success','partial','failed','skipped')), items_fetched integer not null default 0, items_created integer not null default 0,
  error_message text, response_meta jsonb not null default '{}'::jsonb, started_at timestamptz not null default now(), completed_at timestamptz
);

create index interests_user_idx on public.user_interests(user_id); create index keywords_user_idx on public.user_keywords(user_id);
create index sources_user_idx on public.content_sources(user_id); create index clusters_user_idx on public.content_clusters(user_id);
create index digests_user_created_idx on public.digests(user_id,created_at desc); create index notifications_user_status_idx on public.notifications(user_id,status);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger interests_updated before update on public.user_interests for each row execute function public.set_updated_at();
create trigger preferences_updated before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger sources_updated before update on public.content_sources for each row execute function public.set_updated_at();
create trigger items_updated before update on public.content_items for each row execute function public.set_updated_at();
create trigger analysis_updated before update on public.content_analysis for each row execute function public.set_updated_at();
create trigger clusters_updated before update on public.content_clusters for each row execute function public.set_updated_at();
create trigger read_status_updated before update on public.read_status for each row execute function public.set_updated_at();
create trigger notifications_updated before update on public.notifications for each row execute function public.set_updated_at();

alter table public.profiles enable row level security; alter table public.user_interests enable row level security; alter table public.user_keywords enable row level security;
alter table public.important_people enable row level security; alter table public.user_preferences enable row level security; alter table public.content_sources enable row level security;
alter table public.content_items enable row level security; alter table public.content_analysis enable row level security; alter table public.content_embeddings enable row level security;
alter table public.content_clusters enable row level security; alter table public.cluster_members enable row level security; alter table public.bookmarks enable row level security;
alter table public.read_status enable row level security; alter table public.digests enable row level security; alter table public.digest_items enable row level security;
alter table public.notifications enable row level security; alter table public.source_fetch_logs enable row level security;

create policy profiles_own on public.profiles for all to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
create policy interests_own on public.user_interests for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy keywords_own on public.user_keywords for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy people_own on public.important_people for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy preferences_own on public.user_preferences for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy sources_read on public.content_sources for select to authenticated using(user_id is null or (select auth.uid())=user_id or is_global);
create policy sources_write on public.content_sources for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy items_read on public.content_items for select to authenticated using(user_id is null or (select auth.uid())=user_id);
create policy items_write on public.content_items for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy analysis_read on public.content_analysis for select to authenticated using(exists(select 1 from public.content_items i where i.id=content_item_id and (i.user_id is null or i.user_id=(select auth.uid()))));
create policy embeddings_read on public.content_embeddings for select to authenticated using(exists(select 1 from public.content_items i where i.id=content_item_id and (i.user_id is null or i.user_id=(select auth.uid()))));
create policy clusters_read on public.content_clusters for select to authenticated using(user_id is null or (select auth.uid())=user_id);
create policy clusters_write on public.content_clusters for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy cluster_members_read on public.cluster_members for select to authenticated using(exists(select 1 from public.content_clusters c where c.id=cluster_id and (c.user_id is null or c.user_id=(select auth.uid()))));
create policy bookmarks_own on public.bookmarks for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy reads_own on public.read_status for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy digests_own on public.digests for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy digest_items_own on public.digest_items for select to authenticated using(exists(select 1 from public.digests d where d.id=digest_id and d.user_id=(select auth.uid())));
create policy notifications_own on public.notifications for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

grant usage on schema public to authenticated; grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;
