-- One product: an internship application belongs to a PERSON (their Feasters
-- profile), not a separate "student" record — so any signed-in user can apply
-- with one identity + CV. profiles.id == auth.users.id == vb_profiles.id, and
-- every user has a profiles row (signup trigger), so existing rows stay valid.
-- Idempotent. Run on production (ref ipcxdotvjfudtohzpnmy).
alter table public.vb_applications drop constraint if exists vb_applications_student_id_fkey;
alter table public.vb_applications
  add constraint vb_applications_student_id_fkey
  foreign key (student_id) references public.profiles(id) on delete cascade;
