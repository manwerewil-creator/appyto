-- ════════════════════════════════════════════════════════════════════════════
-- Activity log ("memory") — run this once in the Supabase SQL editor on the
-- production project (ref ipcxdotvjfudtohzpnmy). Safe to re-run / idempotent.
-- It does NOT touch any existing table or data.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  summary     text,
  meta        jsonb default '{}',
  created_at  timestamptz default now()
);

create index if not exists activity_user_idx
  on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "own activity" on public.activity_events;
create policy "own activity" on public.activity_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
