// Apply service — Supabase-backed, per-user. Sends a real email from the user's
// connected mailbox, dedupes, and enforces the plan's daily cap.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchJobById, fetchProfile, fetchCreds, hasApplied, appliedToday, sentApplicationsCount,
  addApplication, updateApplication, fetchJobs, logActivity, type ProfileRow,
} from "./data";
import { credsToConfig, emailReady, sendApplication } from "./mailer";
import { supabaseAdmin } from "./supabase/server";
import { matchJobs, applyableJobs } from "./match";
import { PLANS, sendLimitOf, type PlanId } from "./plans";
import type { JobPreferences } from "./types";

function prefsOf(p: ProfileRow | null): JobPreferences {
  return {
    desired_titles: p?.desired_titles ?? [],
    desired_categories: p?.desired_categories ?? [],
    desired_locations: p?.desired_locations ?? [],
    desired_job_types: p?.desired_job_types ?? [],
    keywords: p?.keywords ?? [],
  };
}

export function effectiveCap(p: ProfileRow | null): number {
  const planCap = PLANS[(p?.plan_id as PlanId) ?? "free"]?.dailyApplyCap ?? 0;
  const self = p?.daily_cap ?? planCap;
  return Math.min(planCap, self);
}

async function getCv(p: ProfileRow | null) {
  if (!p?.cv_path) return undefined;
  const { data } = await supabaseAdmin().storage.from("cvs").download(p.cv_path);
  if (!data) return undefined;
  return { filename: p.cv_path.split("/").pop() || "cv.pdf", content: Buffer.from(await data.arrayBuffer()) };
}

// Download the user's extra resource documents to attach alongside the CV.
async function getResourceFiles(p: ProfileRow | null) {
  const files = p?.resource_files ?? [];
  if (!files.length) return [];
  const store = supabaseAdmin().storage.from("cvs");
  const out: { filename: string; content: Buffer }[] = [];
  for (const f of files) {
    const { data } = await store.download(f.path);
    if (data) out.push({ filename: f.name, content: Buffer.from(await data.arrayBuffer()) });
  }
  return out;
}

export interface ApplyOutcome { ok: boolean; status: string; reason?: string; upgrade?: boolean; }

export async function applyToJob(
  sb: SupabaseClient, userId: string, jobId: string,
  override?: { subject?: string; body?: string },
): Promise<ApplyOutcome> {
  const [job, profile, creds] = await Promise.all([
    fetchJobById(sb, jobId), fetchProfile(sb, userId), fetchCreds(sb, userId),
  ]);
  if (!job) return { ok: false, status: "failed", reason: "job not found" };
  if (!emailReady(creds)) return { ok: false, status: "failed", reason: "Connect your email in Settings first." };
  if (!job.apply_email) return { ok: false, status: "skipped", reason: "This job has no email to apply to." };
  if (await hasApplied(sb, userId, job.id)) return { ok: false, status: "skipped", reason: "Already applied to this job." };

  // Free-tier lifetime cap: block (and prompt upgrade) once the allowance is spent.
  const limit = sendLimitOf(profile?.plan_id);
  if (limit != null && (await sentApplicationsCount(sb, userId)) >= limit) {
    return {
      ok: false, status: "limit", upgrade: true,
      reason: `You've used all ${limit} free applications. Upgrade to a plan to keep applying.`,
    };
  }

  const rec = await addApplication(sb, {
    user_id: userId, job_id: job.id, job_title: job.title, company: job.company,
    to_email: job.apply_email, status: "queued",
  }) as { id: string };

  try {
    const [cv, attachments] = await Promise.all([getCv(profile), getResourceFiles(profile)]);
    const { subject } = await sendApplication({ config: credsToConfig(creds!), job, profile: profile ?? {}, cv, attachments, override });
    await updateApplication(sb, rec.id, { status: "sent", subject, sent_at: new Date().toISOString() });
    await logActivity(sb, userId, "application_sent",
      `Applied to ${job.title}${job.company ? ` · ${job.company}` : ""}`,
      { job_id: job.id, company: job.company, to_email: job.apply_email });
    return { ok: true, status: "sent" };
  } catch (err: any) {
    const reason = String(err?.message ?? err);
    await updateApplication(sb, rec.id, { status: "failed", error: reason });
    await logActivity(sb, userId, "application_failed",
      `Application failed: ${job.title}`, { job_id: job.id, error: reason });
    return { ok: false, status: "failed", reason };
  }
}

export interface AutoApplyResult {
  attempted: number; sent: number; skipped: number; failed: number; remainingToday: number;
}

export async function autoApply(sb: SupabaseClient, userId: string, max?: number): Promise<AutoApplyResult> {
  const [jobs, profile] = await Promise.all([fetchJobs(sb), fetchProfile(sb, userId)]);
  const cap = effectiveCap(profile);
  const already = await appliedToday(sb, userId);
  const budget = Math.min(Math.max(0, cap - already), max ?? cap);

  const targets = applyableJobs(matchJobs(jobs, prefsOf(profile)));
  let sent = 0, skipped = 0, failed = 0, attempted = 0;
  for (const job of targets) {
    if (sent >= budget) break;
    if (await hasApplied(sb, userId, job.id)) { skipped++; continue; }
    attempted++;
    const r = await applyToJob(sb, userId, job.id);
    if (r.status === "sent") sent++; else if (r.status === "skipped") skipped++; else failed++;
  }
  return { attempted, sent, skipped, failed, remainingToday: Math.max(0, cap - already - sent) };
}
