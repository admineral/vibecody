-- DocAI repo analysis cache
-- Run in the Supabase SQL editor (or via supabase db push).

create table if not exists public.repo_cache (
  cache_key text primary key,
  url text not null,
  branch text not null,
  commit_sha text,
  version text not null,
  timestamp timestamptz not null default now(),
  payload_bytes integer not null default 0,
  components jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  all_files jsonb not null default '[]'::jsonb,
  repository jsonb not null default '{}'::jsonb
);

create index if not exists repo_cache_timestamp_idx on public.repo_cache (timestamp desc);

alter table public.repo_cache enable row level security;

-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- No anon policies: this table is not public.
