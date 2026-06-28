-- ════════════════════════════════════════════════════════════════════════════
-- VisionBridge (internship marketplace) — merged into Feasters.
-- Run once in the Supabase SQL editor on production (ref ipcxdotvjfudtohzpnmy).
-- Idempotent & non-destructive: create-if-not-exists / drop-policy-if-exists.
-- All tables are vb_* so they never collide with the Feasters tables.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Profiles (one per internship-side user: student / company / university / admin)
create table if not exists public.vb_profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  role             text not null default 'student',   -- student|company|university|admin
  full_name        text,
  email            text,
  phone            text,
  -- student
  university       text,
  program          text,
  year_of_study    text,
  skills           text,
  bio              text,
  cv_url           text,
  paid             boolean not null default false,
  -- company
  company_name     text,
  company_sector   text,
  company_website  text,
  company_verified boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ─── Opportunities (company-posted attachments / internships)
create table if not exists public.vb_opportunities (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.vb_profiles(id) on delete cascade,
  title        text not null,
  description  text,
  location     text,
  field        text,
  positions    int default 1,
  duration     text,
  requirements text,
  deadline     date,
  status       text not null default 'open',          -- open|closed
  created_at   timestamptz not null default now()
);
create index if not exists vb_opps_company_idx on public.vb_opportunities (company_id);
create index if not exists vb_opps_status_idx  on public.vb_opportunities (status);

-- ─── Applications (a student applies to an opportunity)
create table if not exists public.vb_applications (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.vb_opportunities(id) on delete cascade,
  student_id     uuid not null references public.vb_profiles(id) on delete cascade,
  status         text not null default 'pending',     -- pending|shortlisted|interview|accepted|rejected
  cover_note     text,
  cv_url         text,
  created_at     timestamptz not null default now(),
  unique (opportunity_id, student_id)
);
create index if not exists vb_apps_student_idx on public.vb_applications (student_id);
create index if not exists vb_apps_opp_idx     on public.vb_applications (opportunity_id);

-- ─── Payments (the $10 student registration fee)
create table if not exists public.vb_payments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.vb_profiles(id) on delete cascade,
  amount     numeric not null default 10,
  currency   text not null default 'USD',
  method     text,
  reference  text,
  status     text not null default 'completed',
  created_at timestamptz not null default now()
);
create index if not exists vb_pay_student_idx on public.vb_payments (student_id, created_at desc);

-- ─── Direct messages (recruiter ↔ student)
create table if not exists public.vb_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.vb_profiles(id) on delete cascade,
  recipient_id uuid not null references public.vb_profiles(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists vb_msg_pair_idx on public.vb_messages (sender_id, recipient_id, created_at);

-- ─── In-app notifications
create table if not exists public.vb_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.vb_profiles(id) on delete cascade,
  body       text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vb_notif_user_idx on public.vb_notifications (user_id, created_at desc);

-- ─── Helper: current user's role, SECURITY DEFINER so RLS policies can read it
--     without recursing through vb_profiles' own policies.
create or replace function public.vb_my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.vb_profiles where id = auth.uid()
$$;

-- ─── Auto-create a vb_profiles row on signup, but ONLY when the signup metadata
--     carries a `role` (i.e. an internship registration). Feasters job-seekers
--     sign up without a role and must NOT get a vb_profiles row (it would route
--     them into the internship side).
create or replace function public.handle_new_vb_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.raw_user_meta_data ? 'role') then
    insert into public.vb_profiles (id, email, role, full_name, company_name)
    values (
      new.id, new.email,
      coalesce(new.raw_user_meta_data->>'role', 'student'),
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'company_name'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created_vb on auth.users;
create trigger on_auth_user_created_vb after insert on auth.users
  for each row execute function public.handle_new_vb_user();

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.vb_profiles      enable row level security;
alter table public.vb_opportunities enable row level security;
alter table public.vb_applications  enable row level security;
alter table public.vb_payments      enable row level security;
alter table public.vb_messages      enable row level security;
alter table public.vb_notifications enable row level security;

-- vb_profiles: any signed-in user can read profiles (marketplace needs cross-role
-- visibility); you may only insert/update your OWN row.
drop policy if exists "vb_profiles read"   on public.vb_profiles;
drop policy if exists "vb_profiles insert"  on public.vb_profiles;
drop policy if exists "vb_profiles update"  on public.vb_profiles;
create policy "vb_profiles read"   on public.vb_profiles for select using (auth.uid() is not null);
create policy "vb_profiles insert" on public.vb_profiles for insert with check (auth.uid() = id);
create policy "vb_profiles update" on public.vb_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- vb_opportunities: everyone signed-in can read; a company manages its own.
drop policy if exists "vb_opps read"   on public.vb_opportunities;
drop policy if exists "vb_opps write"   on public.vb_opportunities;
drop policy if exists "vb_opps update"  on public.vb_opportunities;
drop policy if exists "vb_opps delete"  on public.vb_opportunities;
create policy "vb_opps read"   on public.vb_opportunities for select using (auth.uid() is not null);
create policy "vb_opps write"  on public.vb_opportunities for insert with check (company_id = auth.uid());
create policy "vb_opps update" on public.vb_opportunities for update using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "vb_opps delete" on public.vb_opportunities for delete using (company_id = auth.uid());

-- vb_applications: a student sees/creates their own; the owning company sees and
-- updates applications to its opportunities; university/admin see all.
drop policy if exists "vb_apps read"   on public.vb_applications;
drop policy if exists "vb_apps insert"  on public.vb_applications;
drop policy if exists "vb_apps update"  on public.vb_applications;
create policy "vb_apps read" on public.vb_applications for select using (
  student_id = auth.uid()
  or exists (select 1 from public.vb_opportunities o where o.id = opportunity_id and o.company_id = auth.uid())
  or public.vb_my_role() in ('university', 'admin')
);
create policy "vb_apps insert" on public.vb_applications for insert with check (student_id = auth.uid());
create policy "vb_apps update" on public.vb_applications for update using (
  exists (select 1 from public.vb_opportunities o where o.id = opportunity_id and o.company_id = auth.uid())
);

-- vb_payments: a student sees/creates their own; university/admin see all.
drop policy if exists "vb_pay read"   on public.vb_payments;
drop policy if exists "vb_pay insert"  on public.vb_payments;
create policy "vb_pay read"   on public.vb_payments for select using (student_id = auth.uid() or public.vb_my_role() in ('university','admin'));
create policy "vb_pay insert" on public.vb_payments for insert with check (student_id = auth.uid());

-- vb_messages: only the two parties can read; you may only send as yourself.
drop policy if exists "vb_msg read"   on public.vb_messages;
drop policy if exists "vb_msg insert"  on public.vb_messages;
create policy "vb_msg read"   on public.vb_messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "vb_msg insert" on public.vb_messages for insert with check (sender_id = auth.uid());

-- vb_notifications: your own only.
drop policy if exists "vb_notif read"   on public.vb_notifications;
drop policy if exists "vb_notif insert"  on public.vb_notifications;
drop policy if exists "vb_notif update"  on public.vb_notifications;
create policy "vb_notif read"   on public.vb_notifications for select using (user_id = auth.uid());
create policy "vb_notif insert" on public.vb_notifications for insert with check (user_id = auth.uid());
create policy "vb_notif update" on public.vb_notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Storage: CVs / documents bucket (public-read, owner-write under {uid}/…)
insert into storage.buckets (id, name, public) values ('vb-documents', 'vb-documents', true)
on conflict (id) do nothing;

drop policy if exists "vb docs public read"  on storage.objects;
drop policy if exists "vb docs owner insert" on storage.objects;
drop policy if exists "vb docs owner update" on storage.objects;
drop policy if exists "vb docs owner delete" on storage.objects;
create policy "vb docs public read"  on storage.objects for select using (bucket_id = 'vb-documents');
create policy "vb docs owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'vb-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vb docs owner update" on storage.objects for update to authenticated
  using (bucket_id = 'vb-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vb docs owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'vb-documents' and (storage.foldername(name))[1] = auth.uid()::text);
