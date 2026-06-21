-- ════════════════════════════════════════════════════════════════════════════
-- Analytics events — page-view / visitor telemetry for the admin dashboard.
-- Run once in the Supabase SQL editor on production (ref ipcxdotvjfudtohzpnmy).
-- Safe to re-run / idempotent. Does NOT touch any existing table or data.
--
-- RLS is enabled with NO policies on purpose: ordinary users (anon/authenticated)
-- can neither read nor write this table. Only the service role — used by the
-- /api/analytics/track writer and the /api/admin reader — can touch it.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text,                              -- anonymous per-device id (cookie)
  user_id     uuid references auth.users(id) on delete set null,
  event       text not null default 'page_view', -- page_view | <custom>
  path        text,
  referrer    text,
  user_agent  text,
  meta        jsonb default '{}'
);

create index if not exists analytics_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_visitor_idx on public.analytics_events (visitor_id);
create index if not exists analytics_event_idx   on public.analytics_events (event);
create index if not exists analytics_user_idx    on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;
-- No policies → locked to the service role only.
