-- ════════════════════════════════════════════════════════════════════════════
-- Remove the standalone internship platform (VisionBridge).
--
-- Internships are now just a plan-gated, internship-filtered slice of the main
-- `jobs` catalogue — there are no separate roles, opportunities, applications, or
-- student fees. The vb_* objects below are no longer read by the app.
--
-- This migration is OPTIONAL and DESTRUCTIVE: running it permanently drops the
-- VisionBridge tables and their data. The app works correctly whether or not you
-- run it (the orphaned tables are simply ignored). Run it in the Supabase SQL
-- editor (prod ref ipcxdotvjfudtohzpnmy) only if you want the database cleaned up.
-- ════════════════════════════════════════════════════════════════════════════

-- Signup trigger + helpers (drop function CASCADE also removes the trigger).
drop trigger if exists on_auth_user_created_vb on auth.users;
drop function if exists public.handle_new_vb_user() cascade;
drop function if exists public.vb_my_role() cascade;

-- Tables (order respects FKs; cascade covers RLS policies + dependents).
drop table if exists public.vb_messages cascade;
drop table if exists public.vb_notifications cascade;
drop table if exists public.vb_applications cascade;
drop table if exists public.vb_opportunities cascade;
drop table if exists public.vb_payments cascade;
drop table if exists public.vb_profiles cascade;

-- Storage bucket used for VisionBridge CV / document uploads.
-- (Empty it first if objects remain, then drop the bucket.)
delete from storage.objects where bucket_id = 'vb-documents';
delete from storage.buckets where id = 'vb-documents';
