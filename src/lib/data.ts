// Central Supabase data access. All routes/pages go through these so queries
// stay consistent. Pass a user-scoped client (supabaseServer) for per-user data
// — RLS enforces ownership — or supabaseAdmin() for cross-user/system writes.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job, ResourceLink, ResourceFile } from "./types";
import type { Resume } from "./resume";
import { DEFAULT_RESUME } from "./resume";
import { cleanCompany } from "./company";

type SB = SupabaseClient;

// Strip the job-board source / generic site account out of `company` so it never
// reaches matching, the email engine or the UI. Single choke point for all reads.
const scrub = (j: Job): Job => ({ ...j, company: cleanCompany(j.company) });

// ── Jobs (public read) ─────────────────────────────────────────────────────
export async function fetchJobs(sb: SB, limit = 5000): Promise<Job[]> {
  const { data } = await sb
    .from("jobs").select("*").eq("is_open", true)
    .order("posted_at", { ascending: false }).limit(limit);
  return ((data ?? []) as Job[]).map(scrub);
}
export interface JobsQuery {
  search?: string; category?: string; location?: string; type?: string;
  onlyEmail?: boolean; page?: number; pageSize?: number;
}
export interface JobsPage { total: number; filtered: number; page: number; pageSize: number; items: Job[]; }

// Server-side filtered + paginated jobs. Filters and paging run in Postgres
// (using the jobs_open/cat/loc/posted indexes) so each request transfers only one
// page — not the whole 5k-row catalogue. This is the scalable path for the board.
export async function fetchJobsPage(sb: SB, qy: JobsQuery): Promise<JobsPage> {
  const page = Math.max(1, qy.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, qy.pageSize ?? 25));
  const start = (page - 1) * pageSize;

  // Total open jobs (unfiltered) — cheap head count, no rows transferred.
  const { count: total } = await sb.from("jobs")
    .select("id", { count: "exact", head: true }).eq("is_open", true);

  let q = sb.from("jobs").select("*", { count: "exact" }).eq("is_open", true);
  if (qy.category) q = q.eq("category", qy.category);
  if (qy.location) q = q.eq("location", qy.location);
  if (qy.type) q = q.eq("job_type", qy.type);
  if (qy.onlyEmail) q = q.not("apply_email", "is", null);
  if (qy.search) {
    // Strip PostgREST `or()` delimiters so the term can't break the filter syntax.
    const s = qy.search.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`title.ilike.%${s}%,company.ilike.%${s}%`);
  }
  q = q.order("posted_at", { ascending: false }).range(start, start + pageSize - 1);

  const { data, count: filtered } = await q;
  return {
    total: total ?? 0,
    filtered: filtered ?? 0,
    page, pageSize,
    items: ((data ?? []) as Job[]).map(scrub),
  };
}

// Lightweight distinct-value counts for the filter dropdowns. Selects only the
// three facet columns (never the bulky description), so it's far cheaper than a
// full fetchJobs() scan.
export async function fetchJobFacets(sb: SB) {
  const { data } = await sb.from("jobs")
    .select("category, location, job_type").eq("is_open", true).limit(8000);
  const rows = (data ?? []) as { category: string | null; location: string | null; job_type: string | null }[];
  const count = (key: "category" | "location" | "job_type") => {
    const m = new Map<string, number>();
    for (const r of rows) { const v = r[key]; if (v) m.set(v, (m.get(v) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, n }));
  };
  return { categories: count("category"), locations: count("location"), types: count("job_type"), totalOpen: rows.length };
}

export async function fetchJobById(sb: SB, id: string): Promise<Job | null> {
  const { data } = await sb.from("jobs").select("*").eq("id", id).maybeSingle();
  return data ? scrub(data as Job) : null;
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
  auto_send: boolean | null;
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
  // Scrub source names from rows logged before sanitisation existed.
  return (data ?? []).map((a) => ({ ...a, company: cleanCompany(a.company) }));
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
// Lifetime count of successfully-sent applications (drives the free-tier limit).
export async function sentApplicationsCount(sb: SB, userId: string): Promise<number> {
  const { count } = await sb.from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("status", "sent");
  return count ?? 0;
}
export async function addApplication(sb: SB, row: Record<string, unknown>) {
  // Upsert on (user_id, job_id): retrying a job whose previous attempt FAILED must
  // reuse that row, not collide with the UNIQUE(user_id, job_id) constraint (500).
  const { data, error } = await sb.from("applications")
    .upsert(row, { onConflict: "user_id,job_id" })
    .select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
export async function updateApplication(sb: SB, id: string, patch: Record<string, unknown>) {
  await sb.from("applications").update(patch).eq("id", id);
}

// ── Activity log ("memory") ─────────────────────────────────────────────────
// Append-only audit trail of what each user does. logActivity NEVER throws —
// failing to record an event must not break the action that triggered it.
export interface ActivityRow {
  id: string; user_id: string; type: string;
  summary: string | null; meta: Record<string, unknown>; created_at: string;
}
export async function logActivity(
  sb: SB, userId: string, type: string, summary: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    await sb.from("activity_events").insert({ user_id: userId, type, summary, meta });
  } catch {
    // Best-effort: swallow (e.g. table not migrated yet) — never block the caller.
  }
}
export async function fetchActivity(sb: SB, userId: string, limit = 50): Promise<ActivityRow[]> {
  const { data } = await sb.from("activity_events").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as ActivityRow[];
}

// ── Web Push subscriptions ──────────────────────────────────────────────────
export interface PushSubRow {
  id: string; user_id: string; endpoint: string; p256dh: string; auth: string;
}
export async function savePushSub(
  sb: SB, userId: string, sub: { endpoint: string; p256dh: string; auth: string },
) {
  await sb.from("push_subscriptions")
    .upsert({ user_id: userId, ...sub }, { onConflict: "endpoint" });
}
export async function deletePushSub(sb: SB, endpoint: string) {
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
export async function fetchPushSubs(sb: SB, userId: string): Promise<PushSubRow[]> {
  const { data } = await sb.from("push_subscriptions").select("*").eq("user_id", userId);
  return (data ?? []) as PushSubRow[];
}

// ── Résumé (stored as jsonb on the profile) ────────────────────────────────
export async function fetchResume(sb: SB, userId: string): Promise<Resume> {
  const p = await fetchProfile(sb, userId);
  return { ...DEFAULT_RESUME, ...(p?.resume ?? {}) };
}
export async function saveResume(sb: SB, userId: string, resume: Resume) {
  await sb.from("profiles").update({ resume }).eq("id", userId);
}
