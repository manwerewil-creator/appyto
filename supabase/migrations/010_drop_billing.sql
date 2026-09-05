-- ════════════════════════════════════════════════════════════════════════════
-- Remove the billing system (Paynow subscriptions + payments).
--
-- The app no longer sells anything: every plan is free and every feature is open
-- to all users. `plans` stays, because a profile's plan_id still decides that
-- user's daily auto-apply allowance — but nothing is charged for any more.
--
-- This migration is OPTIONAL and DESTRUCTIVE: it permanently drops the payment
-- and subscription history, which cannot be recovered. The app works correctly
-- whether or not you run it (the orphaned tables are simply ignored). Export
-- anything you need for your records FIRST, then run it in the Supabase SQL
-- editor only if you want the database cleaned up.
-- ════════════════════════════════════════════════════════════════════════════

-- Tables (cascade covers RLS policies, indexes and dependents).
drop table if exists public.payments cascade;
drop table if exists public.subscriptions cascade;

-- Every plan is free now. The billing columns are kept so older copies of
-- schema.sql stay runnable, but they are no longer read by the app.
update public.plans set price_usd = 0, is_paid = false;

-- Give the free tiers a real auto-apply allowance: with no way to upgrade, a
-- cap of 0 would silently switch auto-apply off for most users.
update public.plans set daily_apply_cap = 15 where id in ('free', 'free_plus');
