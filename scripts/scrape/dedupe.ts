// Cross-source de-duplication.
//
// The same vacancy is frequently re-posted on more than one board (e.g. an
// "Accountant" role appears on jobszimbabwe AND vacancybox). The product rule is
// "similar jobs are not added — you just add one", and listings must never reveal
// which board they came from. So before persisting, we collapse duplicates into a
// single canonical record.
//
// Identity is only asserted when there's a STRONG signal:
//   • same normalized title + same apply email, or
//   • same normalized title + same normalized company.
// Without an email or a company the title alone is too weak to merge (two
// different employers can both post "Driver" in "Harare"), so those are kept.
//
// The winner is chosen DETERMINISTICALLY (same input → same survivor every run),
// so re-runs never flip which row lives and the DB doesn't accumulate dupes:
//   1. has an apply email          (most useful to the user)
//   2. lower source priority        (keeps ids stable on the established boards)
//   3. longer description           (richer listing)
//   4. lexicographically smaller id (final, fully-deterministic tiebreak)

import type { NormalizedJob } from "./types.ts";

// Lower = preferred. Established sources win so their ids stay stable across runs.
const SOURCE_PRIORITY: Record<string, number> = {
  jobszimbabwe: 0,
  applynow: 1,
  vacancybox: 2,
};

function normTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function normCompany(company: string | null): string | null {
  if (!company) return null;
  const c = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return c.length >= 3 ? c : null;
}

/** A strong identity key, or null when the job is too weakly identified to merge. */
function dedupeKey(job: NormalizedJob): string | null {
  const title = normTitle(job.title);
  if (!title) return null;
  const email = job.apply_email?.toLowerCase().trim();
  if (email) return `t:${title}|m:${email}`;
  const company = normCompany(job.company);
  if (company) return `t:${title}|c:${company}`;
  return null;
}

function id(job: NormalizedJob): string {
  return `${job.source}:${job.source_uid}`;
}

/** True if `a` is the better record to keep over `b`. */
function preferred(a: NormalizedJob, b: NormalizedJob): boolean {
  const aMail = a.apply_email ? 1 : 0;
  const bMail = b.apply_email ? 1 : 0;
  if (aMail !== bMail) return aMail > bMail;

  const aPri = SOURCE_PRIORITY[a.source] ?? 99;
  const bPri = SOURCE_PRIORITY[b.source] ?? 99;
  if (aPri !== bPri) return aPri < bPri;

  const aLen = a.description?.length ?? 0;
  const bLen = b.description?.length ?? 0;
  if (aLen !== bLen) return aLen > bLen;

  return id(a) < id(b);
}

export interface DedupeResult {
  kept: NormalizedJob[];
  dropped: number;
  merged: number; // how many distinct logical jobs had >1 source copy
}

/** Collapse cross-source duplicates, keeping one canonical record per job. */
export function dedupeJobs(jobs: NormalizedJob[]): DedupeResult {
  const winners = new Map<string, NormalizedJob>();
  const mergedKeys = new Set<string>();
  const unmerged: NormalizedJob[] = []; // weakly-identified → always kept
  let dropped = 0;

  for (const job of jobs) {
    const key = dedupeKey(job);
    if (!key) { unmerged.push(job); continue; }

    const current = winners.get(key);
    if (!current) {
      winners.set(key, job);
    } else {
      mergedKeys.add(key);
      dropped++;
      if (preferred(job, current)) winners.set(key, job);
    }
  }

  return {
    kept: [...winners.values(), ...unmerged],
    dropped,
    merged: mergedKeys.size,
  };
}
