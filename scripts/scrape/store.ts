// Persistence for the scraper. Local-first: write a CSV snapshot AND merge into
// data/jobs.json (the file the web app reads). Optionally mirror to a Google
// Sheet via an Apps Script webhook.

import { stringify } from "csv-stringify/sync";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import type { NormalizedJob } from "./types.ts";

const DATA_DIR = process.env.APPYTO_DATA_DIR
  ? path.resolve(process.env.APPYTO_DATA_DIR)
  : path.resolve(process.cwd(), "data");

// Map the scraper's NormalizedJob onto the app's Job shape (adds stable id,
// drops bulky fields the UI doesn't need).
function toAppJob(j: NormalizedJob) {
  return {
    id: `${j.source}:${j.source_uid}`,
    source: j.source,
    source_uid: j.source_uid,
    url: j.url,
    title: j.title,
    company: j.company,
    location: j.location,
    category: j.category,
    job_type: j.job_type,
    tags: j.tags,
    description: j.description.replace(/\s+/g, " ").trim().slice(0, 6000),
    apply_email: j.apply_email,
    apply_url: j.apply_url,
    apply_method: j.apply_method,
    salary: j.salary,
    posted_at: j.posted_at,
    closes_at: j.closes_at,
    is_open: j.is_open,
  };
}

async function writeJsonAtomic(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await rename(tmp, file);
}

/** Merge scraped jobs into data/jobs.json by id (newest data wins). */
export async function mergeJobsJson(jobs: NormalizedJob[]): Promise<number> {
  const target = path.join(DATA_DIR, "jobs.json");
  let existing: any[] = [];
  try { existing = JSON.parse(await readFile(target, "utf8")); } catch { /* first run */ }
  const byId = new Map(existing.map((j) => [j.id, j]));
  for (const j of jobs) { const a = toAppJob(j); byId.set(a.id, a); }
  const merged = [...byId.values()].sort((a, b) =>
    String(b.posted_at ?? "").localeCompare(String(a.posted_at ?? "")));
  await writeJsonAtomic(target, merged);
  return merged.length;
}

const CSV_COLUMNS = [
  "id", "source", "title", "company", "location", "category", "job_type",
  "salary", "apply_method", "apply_email", "apply_url", "posted_at",
  "closes_at", "is_open", "url", "description",
];

export async function writeCsv(jobs: NormalizedJob[], source: string): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const rows = jobs.map((j) => ({
    ...toAppJob(j),
    tags: j.tags.join("|"),
    description: j.description.replace(/\s+/g, " ").slice(0, 4000),
  }));
  const csv = stringify(rows, { header: true, columns: CSV_COLUMNS });
  const fp = path.join(DATA_DIR, `appyto-${source}.csv`);
  await writeFile(fp, csv, "utf8");
  return fp;
}

/** Upsert scraped jobs into the Supabase `jobs` table (service role). */
export async function upsertSupabase(jobs: NormalizedJob[]): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 0; // Supabase not configured — local CSV/JSON only.
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const rows = jobs.map(toAppJob);
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const slice = rows.slice(i, i + 500);
    const { error } = await sb.from("jobs").upsert(slice, { onConflict: "id" });
    if (error) console.error("  ✗ Supabase upsert:", error.message);
    else written += slice.length;
  }
  return written;
}

export async function pushToSheet(jobs: NormalizedJob[]): Promise<void> {
  const hook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!hook) return;
  const rows = jobs.map((j) => {
    const a = toAppJob(j) as Record<string, unknown>;
    return CSV_COLUMNS.map((c) => a[c] ?? "");
  });
  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ columns: CSV_COLUMNS, rows }),
  });
  if (!res.ok) console.warn(`  ⚠ Sheets webhook returned ${res.status}`);
}
