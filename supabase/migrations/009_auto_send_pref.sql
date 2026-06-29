-- 009_auto_send_pref.sql
-- Per-user sending preference, asked during onboarding:
--   false (default) → review & customise each application before it sends
--   true            → send automatically with the engine-generated email
-- Idempotent. Run in the Supabase SQL editor (prod ref ipcxdotvjfudtohzpnmy).
alter table public.profiles
  add column if not exists auto_send boolean not null default false;
