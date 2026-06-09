// Central Supabase data access. All routes/pages go through these so queries
// stay consistent. Pass a user-scoped client (supabaseServer) for per-user data
// — RLS enforces ownership — or supabaseAdmin() for cross-user/system writes.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job, ResourceLink, ResourceFile } from "./types";
import type { Resume } from "./resume";
import { DEFAULT_RESUME } from "./resume";

type SB = SupabaseClient;

// ── Jobs (public read) ─────────────────────────────────────────────────────
export async function fetchJobs(sb: SB, limit = 5000): Promise<Job[]> {
  const { data } = await sb
    .from("jobs").select("*").eq("is_open", true)
    .order("posted_at", { ascending: false }).limit(limit);
  return (data ?? []) as Job[];
}
export async function fetchJobById(sb: SB, id: string): Promise<Job | null> {
  const { data } = await sb.from("jobs").select("*").eq("id", id).maybeSingle();
  return (data as Job) ?? null;
}
export async function upsertJob(sb: SB, job: Job): Promise<void> {
  await sb.from("jobs").upsert(job, { onConflict: "id" });
}

// ── Profile ────────────────────────────────────────────────────────────────
export interface ProfileRow {
  id: string; email: string | null; full_name: string | null; phone: string | null;
  qualifications: string | null; work_modes: string[]; desired_titles: string[];
  desired_categories: string[]; desired_locations: string[]; desired_job_types: string[];
  keywords: string[]; cv_path: string | null; cover_letter_template: string | null;
  plan_id: string; daily_cap: number; onboarded: boolean; resume: Resume | null;
  resources: ResourceLink[] | null; resource_files: ResourceFile[] | null;
}
export async function fetchProfile(sb: SB, userId: string): Promise<ProfileRow | null> {
  const { data } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as ProfileRow | null;
}
export async function saveProfile(sb: SB, userId: string, patch: Record<string, unknown>) {
  const { data, error } = await sb.from("profiles")
    .update(patch).eq("id", userId).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ── Send credentials ───────────────────────────────────────────────────────
export interface CredsRow {
  user_id: string; method: "smtp" | "google"; from_email: string | null;
  smtp_host: string; smtp_port: number; secret_enc: string | null;
  google_refresh_enc: string | null; verified: boolean;
}
export async function fetchCreds(sb: SB, userId: string): Promise<CredsRow | null> {
  const { data } = await sb.from("send_credentials").select("*").eq("user_id", userId).maybeSingle();
  return data as CredsRow | null;
}
export async function saveCreds(sb: SB, userId: string, patch: Record<string, unknown>) {
  await sb.from("send_credentials").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
}

// ── Applications ───────────────────────────────────────────────────────────
export async function fetchApplications(sb: SB, userId: string) {
  const { data } = await sb.from("applications").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}
export async function hasApplied(sb: SB, userId: string, jobId: string): Promise<boolean> {
  const { data } = await sb.from("applications").select("id")
    .eq("user_id", userId).eq("job_id", jobId).neq("status", "failed").maybeSingle();
  return !!data;
}
export async function appliedToday(sb: SB, userId: string): Promise<number> {
  const { data } = await sb.rpc("applications_today", { p_user: userId });
  return (data as number) ?? 0;
}
export async function addApplication(sb: SB, row: Record<string, unknown>) {
  const { data, error } = await sb.from("applications").insert(row).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
export async function updateApplication(sb: SB, id: string, patch: Record<string, unknown>) {
  await sb.from("applications").update(patch).eq("id", id);
}

// ── Résumé (stored as jsonb on the profile) ────────────────────────────────
export async function fetchResume(sb: SB, userId: string): Promise<Resume> {
  const p = await fetchProfile(sb, userId);
  return { ...DEFAULT_RESUME, ...(p?.resume ?? {}) };
}
export async function saveResume(sb: SB, userId: string, resume: Resume) {
  await sb.from("profiles").update({ resume }).eq("id", userId);
}
