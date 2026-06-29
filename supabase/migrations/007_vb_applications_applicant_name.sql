-- Snapshot the applicant's display name on the application so a company can show
-- who applied without reading the applicant's private Feasters profile (profiles
-- RLS is own-row only). Set at apply time. Idempotent.
alter table public.vb_applications add column if not exists applicant_name text;
