import { NextResponse } from "next/server";
import { getJobs, getProfile, getApplications } from "@/lib/db";
import { matchJobs } from "@/lib/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [jobs, profile, apps] = await Promise.all([getJobs(), getProfile(), getApplications()]);

  const hasPrefs =
    profile.desired_titles.length + profile.desired_categories.length +
    profile.desired_locations.length + profile.desired_job_types.length +
    profile.keywords.length > 0;

  const scored = matchJobs(jobs, profile);
  const appliedIds = new Set(apps.filter((a) => a.status !== "failed").map((a) => a.job_id));

  const items = scored.map((j) => ({ ...j, applied: appliedIds.has(j.id) }));

  return NextResponse.json({
    hasPrefs,
    count: items.length,
    applyable: items.filter((j) => j.apply_method === "email" && j.apply_email && !j.applied).length,
    items: items.slice(0, 300),
  });
}
