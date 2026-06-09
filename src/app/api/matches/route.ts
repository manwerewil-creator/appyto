import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobs, fetchProfile, fetchApplications } from "@/lib/data";
import { matchJobs } from "@/lib/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [jobs, profile, apps] = await Promise.all([
    fetchJobs(sb),
    fetchProfile(sb, user.id),
    fetchApplications(sb, user.id),
  ]);

  const prefs = {
    desired_titles: profile?.desired_titles ?? [],
    desired_categories: profile?.desired_categories ?? [],
    desired_locations: profile?.desired_locations ?? [],
    desired_job_types: profile?.desired_job_types ?? [],
    keywords: profile?.keywords ?? [],
  };

  const hasPrefs =
    prefs.desired_titles.length + prefs.desired_categories.length +
    prefs.desired_locations.length + prefs.desired_job_types.length +
    prefs.keywords.length > 0;

  const scored = matchJobs(jobs, prefs);
  const appliedIds = new Set(
    apps.filter((a: { status: string }) => a.status !== "failed")
      .map((a: { job_id: string }) => a.job_id),
  );

  return NextResponse.json({
    hasPrefs,
    count: scored.length,
    applyable: scored.filter((j) => j.apply_method === "email" && j.apply_email && !appliedIds.has(j.id)).length,
    items: scored.slice(0, 300).map((j) => ({ ...j, applied: appliedIds.has(j.id) })),
  });
}
