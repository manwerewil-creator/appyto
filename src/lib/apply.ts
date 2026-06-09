// Server-side apply service. Turns "click Apply" into a real sent email, with
// dedupe, a daily safety cap, and a full audit record. Used by /api/apply and
// /api/apply/auto.

import {
  getJobs, getProfile, getSettings, hasApplied, appliedToday,
  addApplication, updateApplication, readCv,
} from "./db";
import { sendApplication, emailReady } from "./mailer";
import { matchJobs, applyableJobs } from "./match";
import type { Application } from "./types";

function newId() {
  return `app_${Date.now().toString(36)}_${Math.round(performance.now() % 1e6).toString(36)}`;
}

export interface ApplyOutcome {
  ok: boolean;
  status: Application["status"];
  reason?: string;
  application?: Application;
}

/** Apply to a single job by id. Sends a real email from your configured mailbox.
 *  `override` lets the user supply a fully custom subject/body instead of the template. */
export async function applyToJob(jobId: string, override?: { subject?: string; body?: string }): Promise<ApplyOutcome> {
  const [jobs, profile, settings] = await Promise.all([getJobs(), getProfile(), getSettings()]);
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return { ok: false, status: "failed", reason: "job not found" };
  if (!emailReady(settings)) return { ok: false, status: "failed", reason: "Connect your email in Settings first." };
  if (!job.apply_email) return { ok: false, status: "skipped", reason: "This job has no email to apply to." };
  if (await hasApplied(job.id)) return { ok: false, status: "skipped", reason: "Already applied to this job." };

  const record: Application = {
    id: newId(),
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    to_email: job.apply_email,
    status: "queued",
    subject: null,
    error: null,
    created_at: new Date().toISOString(),
    sent_at: null,
  };
  await addApplication(record);

  try {
    let cv: { filename: string; content: Buffer } | undefined;
    if (profile.cv_filename) {
      cv = { filename: profile.cv_filename, content: await readCv(profile.cv_filename) };
    }
    const { subject } = await sendApplication({ settings, job, profile, cv, override });
    const patch = { status: "sent" as const, subject, sent_at: new Date().toISOString() };
    await updateApplication(record.id, patch);
    return { ok: true, status: "sent", application: { ...record, ...patch } };
  } catch (err: any) {
    const patch = { status: "failed" as const, error: String(err?.message ?? err) };
    await updateApplication(record.id, patch);
    return { ok: false, status: "failed", reason: patch.error, application: { ...record, ...patch } };
  }
}

export interface AutoApplyResult {
  attempted: number; sent: number; skipped: number; failed: number;
  remainingToday: number; results: ApplyOutcome[];
}

/** Auto-apply to your best matches, up to the daily cap. */
export async function autoApply(max?: number): Promise<AutoApplyResult> {
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()]);
  const alreadyToday = await appliedToday();
  const remaining = Math.max(0, profile.daily_cap - alreadyToday);
  const budget = Math.min(remaining, max ?? remaining);

  const matched = applyableJobs(matchJobs(jobs, profile));
  const results: ApplyOutcome[] = [];
  let sent = 0, skipped = 0, failed = 0, attempted = 0;

  for (const job of matched) {
    if (sent >= budget) break;
    if (await hasApplied(job.id)) { skipped++; continue; }
    attempted++;
    const r = await applyToJob(job.id);
    results.push(r);
    if (r.status === "sent") sent++;
    else if (r.status === "skipped") skipped++;
    else failed++;
  }

  return { attempted, sent, skipped, failed, remainingToday: remaining - sent, results };
}
