-- ════════════════════════════════════════════════════════════════════════════
-- Web Push (browser push notifications) — run once in the Supabase SQL editor on
-- the production project (ref ipcxdotvjfudtohzpnmy). Safe to re-run / idempotent.
-- ════════════════════════════════════════════════════════════════════════════

-- One row per browser/device a user has granted push permission on.
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null unique,        -- the push service URL (unique per device)
  p256dh      text not null,               -- client public key (encryption)
  auth        text not null,               -- client auth secret
  created_at  timestamptz default now()
);

create index if not exists push_sub_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Watermark: the newest job (by scraped_at) the user has already been alerted
-- about. The notify cron only pushes jobs scraped after this, then bumps it.
alter table public.profiles
  add column if not exists jobs_notified_at timestamptz;
