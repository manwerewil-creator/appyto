// Local-first JSON data store. Zero external dependencies — the whole app's
// state lives in flat files under ./data so it runs the moment you open it.
//
//   data/jobs.json          — written by the scraper (npm run scrape)
//   data/profile.json       — your profile + job preferences
//   data/settings.json      — your SMTP/Gmail credentials (local machine only)
//   data/applications.json  — log of every application sent/queued/failed
//   data/cv/<filename>      — your uploaded CV
//
// On Vercel the filesystem is ephemeral; for a hosted multi-user version swap
// this module for a real DB. For a personal portable app, files are perfect.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type Job, type Profile, type Settings, type Application,
  DEFAULT_PROFILE, DEFAULT_SETTINGS,
} from "./types";
import { type Resume, DEFAULT_RESUME } from "./resume";

export const DATA_DIR = process.env.APPYTO_DATA_DIR
  ? path.resolve(process.env.APPYTO_DATA_DIR)
  : path.resolve(process.cwd(), "data");
export const CV_DIR = path.join(DATA_DIR, "cv");

const file = (name: string) => path.join(DATA_DIR, name);

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, value: unknown): Promise<void> {
  await ensureDir(DATA_DIR);
  // atomic-ish write: tmp then rename
  const tmp = file(`.${name}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file(name));
}

// ── Jobs ─────────────────────────────────────────────────────────────────
export async function getJobs(): Promise<Job[]> {
  return readJson<Job[]>("jobs.json", []);
}

/** Merge new jobs into the store keyed by id, newest data wins. */
export async function upsertJobs(incoming: Job[]): Promise<number> {
  const existing = await getJobs();
  const byId = new Map(existing.map((j) => [j.id, j]));
  for (const j of incoming) byId.set(j.id, j);
  const merged = [...byId.values()].sort((a, b) =>
    (b.posted_at ?? "").localeCompare(a.posted_at ?? ""));
  await writeJson("jobs.json", merged);
  return incoming.length;
}

// ── Profile ──────────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile> {
  return { ...DEFAULT_PROFILE, ...(await readJson<Partial<Profile>>("profile.json", {})) };
}
export async function saveProfile(p: Partial<Profile>): Promise<Profile> {
  const next = { ...(await getProfile()), ...p };
  await writeJson("profile.json", next);
  return next;
}

// ── Settings (SMTP) ────────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>("settings.json", {})) };
}
export async function saveSettings(s: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...s };
  await writeJson("settings.json", next);
  return next;
}

// ── Applications ───────────────────────────────────────────────────────────
export async function getApplications(): Promise<Application[]> {
  return readJson<Application[]>("applications.json", []);
}
export async function hasApplied(jobId: string): Promise<boolean> {
  return (await getApplications()).some(
    (a) => a.job_id === jobId && a.status !== "failed",
  );
}
export async function appliedToday(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  return (await getApplications()).filter(
    (a) => a.status === "sent" && a.sent_at?.slice(0, 10) === today,
  ).length;
}
export async function addApplication(a: Application): Promise<void> {
  const all = await getApplications();
  all.unshift(a);
  await writeJson("applications.json", all);
}
export async function updateApplication(id: string, patch: Partial<Application>): Promise<void> {
  const all = await getApplications();
  const i = all.findIndex((a) => a.id === id);
  if (i >= 0) { all[i] = { ...all[i], ...patch }; await writeJson("applications.json", all); }
}

// ── Résumé builder ───────────────────────────────────────────────────────────
export async function getResume(): Promise<Resume> {
  return { ...DEFAULT_RESUME, ...(await readJson<Partial<Resume>>("resume.json", {})) };
}
export async function saveResume(r: Partial<Resume>): Promise<Resume> {
  const next = { ...(await getResume()), ...r };
  await writeJson("resume.json", next);
  return next;
}

// ── CV (uploaded file, used as the email attachment) ─────────────────────────
export async function saveCv(filename: string, bytes: Buffer): Promise<string> {
  await ensureDir(CV_DIR);
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  await fs.writeFile(path.join(CV_DIR, safe), bytes);
  return safe;
}
export async function readCv(filename: string): Promise<Buffer> {
  return fs.readFile(path.join(CV_DIR, filename));
}
