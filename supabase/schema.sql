-- ════════════════════════════════════════════════════════════════════════════
-- Appyto — PRODUCTION schema (multi-user, Google login, Paynow subscriptions)
-- Run in the Supabase SQL editor. Fully idempotent and NON-destructive: every
-- statement is create-if-not-exists / create-or-replace / on-conflict-do-update,
-- so re-running it never drops a table or touches existing user data.
--
-- ⚠️ The app is LIVE with real users + payments. Do NOT add `drop table`/`drop
-- schema` statements here. To restructure an existing table, write a targeted,
-- reversible migration under supabase/migrations/ instead.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Plans / tiers ──────────────────────────────────────────────────────────
create table if not exists public.plans (
  id              text primary key,            -- free, free_plus, base, pro, premium
  name            text not null,
  price_usd       numeric not null default 0,
  daily_apply_cap int not null default 0,
  is_paid         boolean not null default false,
  sort            int not null default 0,
  features        jsonb default '{}'
);

insert into public.plans (id, name, price_usd, daily_apply_cap, is_paid, sort) values
  ('free',      'Free',     0,   0,   false, 0),
  ('free_plus', 'Free+',    0,   5,   false, 1),
  ('base',      'Base',     17,  15,  true,  2),
  ('pro',       'Pro',      25,  50,  true,  3),
  ('premium',   'Premium',  60,  150, true,  4)
on conflict (id) do update set
  name = excluded.name, price_usd = excluded.price_usd,
  daily_apply_cap = excluded.daily_apply_cap, is_paid = excluded.is_paid, sort = excluded.sort;

-- ─── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  phone         text,
  qualifications text default '',
  work_modes    text[] default '{}',
  desired_titles text[] default '{}',
  desired_categories text[] default '{}',
  desired_locations  text[] default '{}',
  desired_job_types  text[] default '{}',
  keywords      text[] default '{}',
  cv_path       text,                          -- Supabase Storage path
  cover_letter_template text default '',
  plan_id       text not null default 'free' references public.plans(id),
  daily_cap     int not null default 25,
  onboarded     boolean default false,
  resume        jsonb default '{}',            -- CV builder document
  resources     jsonb default '[]',            -- extra application links: [{label,url}]
  resource_files jsonb default '[]',           -- extra uploaded docs: [{name,path}]
  created_at    timestamptz default now()
);

-- Backfill for existing databases (idempotent).
alter table public.profiles add column if not exists resources jsonb default '[]';
alter table public.profiles add column if not exists resource_files jsonb default '[]';

-- Per-user sending method (Google OAuth tokens OR SMTP app password), encrypted.
create table if not exists public.send_credentials (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  method      text not null default 'smtp',    -- 'smtp' | 'google'
  from_email  text,
  smtp_host   text default 'smtp.gmail.com',
  smtp_port   int default 587,
  secret_enc  text,                            -- encrypted app password
  google_refresh_enc text,                     -- encrypted Google refresh token
  verified    boolean default false,
  updated_at  timestamptz default now()
);

-- ─── Jobs (shared catalogue; scraper writes via service role) ───────────────
create table if not exists public.jobs (
  id            text primary key,               -- `${source}:${source_uid}`
  source        text not null,
  source_uid    text not null,
  url           text,
  title         text not null,
  company       text,
  location      text,
  category      text,
  job_type      text,
  tags          text[] default '{}',
  description   text,
  apply_email   text,
  apply_url     text,
  apply_method  text,
  salary        text,
  posted_at     timestamptz,
  closes_at     timestamptz,
  is_open       boolean default true,
  logo_url      text,                           -- company logo (from employer email domain)
  scraped_at    timestamptz default now()
);

-- Backfill for existing databases (idempotent).
alter table public.jobs add column if not exists logo_url text;
create index if not exists jobs_open_idx on public.jobs (is_open) where is_open;
create index if not exists jobs_posted_idx on public.jobs (posted_at desc);
create index if not exists jobs_cat_idx on public.jobs (category);
create index if not exists jobs_loc_idx on public.jobs (location);

-- ─── Applications ───────────────────────────────────────────────────────────
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  job_id      text not null references public.jobs(id) on delete cascade,
  job_title   text,
  company     text,
  to_email    text,
  status      text not null default 'queued',   -- queued|sent|failed|skipped
  subject     text,
  body        text,
  error       text,
  created_at  timestamptz default now(),
  sent_at     timestamptz,
  unique (user_id, job_id)
);
create index if not exists app_user_day_idx on public.applications (user_id, created_at);

create or replace function public.applications_today(p_user uuid)
returns int language sql stable as $$
  select count(*)::int from public.applications
  where user_id = p_user and status = 'sent' and sent_at >= date_trunc('day', now());
$$;

-- ─── Paynow subscriptions + payments ────────────────────────────────────────
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  plan_id       text not null references public.plans(id),
  status        text not null default 'pending', -- pending|active|cancelled|expired
  period_end    timestamptz,
  created_at    timestamptz default now(),
  unique (user_id)
);

create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  plan_id         text not null references public.plans(id),
  amount_usd      numeric not null,
  reference       text not null,                 -- our merchant reference
  paynow_poll_url text,
  paynow_ref      text,
  status          text not null default 'created', -- created|paid|cancelled|failed
  created_at      timestamptz default now(),
  paid_at         timestamptz
);
create index if not exists pay_user_idx on public.payments (user_id, created_at desc);

-- ─── Activity log (the app's "memory" of what each user does) ───────────────
-- A per-user audit trail: applications sent, profile/email updates, plan
-- changes, onboarding, sign-ins. Append-only, surfaced as a Recent Activity
-- feed. Writes never block the action that produced them.
create table if not exists public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,                  -- application_sent, profile_updated, email_connected, plan_upgraded, onboarded, signed_in, …
  summary     text,                            -- human-readable one-liner
  meta        jsonb default '{}',              -- structured detail (job_id, plan, etc.)
  created_at  timestamptz default now()
);
create index if not exists activity_user_idx on public.activity_events (user_id, created_at desc);

-- ─── Analytics events (page-view / visitor telemetry, admin-only) ───────────
-- Captures anonymous + signed-in traffic for the admin dashboard. RLS is on with
-- NO policies on purpose: only the service role (the track writer + admin reader)
-- can touch it — ordinary users can neither read nor write.
create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text,                              -- anonymous per-device id (cookie)
  user_id     uuid references auth.users(id) on delete set null,
  event       text not null default 'page_view',
  path        text,
  referrer    text,
  user_agent  text,
  meta        jsonb default '{}'
);
create index if not exists analytics_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_visitor_idx on public.analytics_events (visitor_id);
create index if not exists analytics_event_idx   on public.analytics_events (event);
create index if not exists analytics_user_idx    on public.analytics_events (user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.send_credentials enable row level security;
alter table public.applications     enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.payments         enable row level security;
alter table public.jobs             enable row level security;
alter table public.plans            enable row level security;
alter table public.activity_events  enable row level security;
alter table public.analytics_events enable row level security; -- no policies → service-role only

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own creds" on public.send_credentials;
create policy "own creds" on public.send_credentials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own apps" on public.applications;
create policy "own apps" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own subs" on public.subscriptions;
create policy "own subs" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own pays" on public.payments;
create policy "own pays" on public.payments for select using (auth.uid() = user_id);
drop policy if exists "own activity" on public.activity_events;
create policy "own activity" on public.activity_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "jobs public read" on public.jobs;
create policy "jobs public read" on public.jobs for select using (true);
drop policy if exists "plans public read" on public.plans;
create policy "plans public read" on public.plans for select using (true);

-- Auto-create a profile when a user signs up (Google login included).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
