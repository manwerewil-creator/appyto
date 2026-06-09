// Pure-code job matching. No AI — deterministic scoring of a job against a
// candidate's onboarding preferences. Used both to count "X jobs for you" and
// to pick which jobs the auto-apply engine targets.

import type { Job, JobPreferences } from "./types";

export interface ScoredJob extends Job {
  score: number;
  reasons: string[];
}

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase();
}

function anyHit(needles: string[], haystack: string): string[] {
  return needles.filter((n) => n && haystack.includes(n.toLowerCase()));
}

/**
 * Score a single job 0..100 against preferences. Weighting:
 *   title match 40, category 25, location 20, job type 10, keyword 5 (capped).
 * A score of 0 means "not a match" and is filtered out by matchJobs().
 */
export function scoreJob(job: Job, prefs: JobPreferences): ScoredJob {
  const reasons: string[] = [];
  let score = 0;

  const titleHay = norm(job.title) + " " + norm(job.description);
  const titleHits = anyHit(prefs.desired_titles, titleHay);
  if (titleHits.length) {
    score += 40;
    reasons.push(`title: ${titleHits.join(", ")}`);
  }

  const catHits = anyHit(prefs.desired_categories, norm(job.category));
  if (catHits.length) {
    score += 25;
    reasons.push(`category: ${job.category}`);
  }

  // Location: empty preference = open to anywhere (don't penalise).
  if (prefs.desired_locations.length === 0) {
    score += 10;
  } else {
    const locHits = anyHit(prefs.desired_locations, norm(job.location));
    if (locHits.length) {
      score += 20;
      reasons.push(`location: ${job.location}`);
    }
  }

  const typeHits = anyHit(prefs.desired_job_types, norm(job.job_type));
  if (typeHits.length) {
    score += 10;
    reasons.push(`type: ${job.job_type}`);
  }

  const kwHits = anyHit(prefs.keywords, titleHay);
  if (kwHits.length) {
    score += Math.min(5, kwHits.length * 2);
    reasons.push(`keywords: ${kwHits.slice(0, 3).join(", ")}`);
  }

  return { ...job, score: Math.min(100, score), reasons };
}

/** Filter + rank a pool of jobs for a candidate. Only open jobs above threshold. */
export function matchJobs(
  jobs: Job[],
  prefs: JobPreferences,
  { minScore = 25 }: { minScore?: number } = {},
): ScoredJob[] {
  return jobs
    .filter((j) => j.is_open)
    .map((j) => scoreJob(j, prefs))
    .filter((j) => j.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/** Jobs the auto-apply engine should target: matched, has an email, not closed. */
export function applyableJobs(scored: ScoredJob[]): ScoredJob[] {
  return scored.filter((j) => j.apply_method === "email" && j.apply_email);
}
