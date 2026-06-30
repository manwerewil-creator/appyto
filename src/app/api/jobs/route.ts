import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobs, fetchJobsPage, fetchProfile } from "@/lib/data";
import { isInternshipJob } from "@/lib/internships";
import { canAccessInternships } from "@/lib/plans";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const search = (sp.get("search") ?? "").trim();
  const category = sp.get("category") ?? "";
  const location = sp.get("location") ?? "";
  const type = sp.get("type") ?? "";
  const onlyEmail = sp.get("onlyEmail") === "1";
  const internshipsOnly = sp.get("internships") === "1";
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 25)));

  // Internships are a plan-gated slice whose detection is a JS regex over the job
  // body — it can't be expressed as a SQL filter, so this gated, low-traffic path
  // scans a bounded recent pool in memory. Enforced server-side (not just hidden).
  if (internshipsOnly) {
    const profile = await fetchProfile(sb, user.id);
    if (!canAccessInternships(profile?.plan_id)) {
      return NextResponse.json({ error: "upgrade_required", locked: true }, { status: 403 });
    }
    let jobs = (await fetchJobs(sb, 4000)).filter(isInternshipJob);
    const total = jobs.length;
    const q = search.toLowerCase();
    if (q) jobs = jobs.filter((j) =>
      (j.title + " " + (j.company ?? "") + " " + (j.description ?? "")).toLowerCase().includes(q));
    if (category) jobs = jobs.filter((j: Job) => j.category === category);
    if (location) jobs = jobs.filter((j: Job) => j.location === location);
    if (type) jobs = jobs.filter((j: Job) => j.job_type === type);
    if (onlyEmail) jobs = jobs.filter((j: Job) => !!j.apply_email);
    const start = (page - 1) * pageSize;
    return NextResponse.json({
      total, filtered: jobs.length, page, pageSize, items: jobs.slice(start, start + pageSize),
    });
  }

  // Main job board: filter + paginate in Postgres, transferring only one page.
  const result = await fetchJobsPage(sb, { search, category, location, type, onlyEmail, page, pageSize });
  return NextResponse.json(result);
}
