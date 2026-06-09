import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  fetchJobs, fetchProfile, fetchApplications, fetchCreds, appliedToday,
} from "@/lib/data";
import { matchJobs } from "@/lib/match";
import { effectiveCap } from "@/lib/apply";
import { emailReady } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Numbers for the Overview dashboard.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [jobs, profile, apps, creds, today] = await Promise.all([
    fetchJobs(sb),
    fetchProfile(sb, user.id),
    fetchApplications(sb, user.id),
    fetchCreds(sb, user.id),
    appliedToday(sb, user.id),
  ]);

  const prefs = {
    desired_titles: profile?.desired_titles ?? [],
    desired_categories: profile?.desired_categories ?? [],
    desired_locations: profile?.desired_locations ?? [],
    desired_job_types: profile?.desired_job_types ?? [],
    keywords: profile?.keywords ?? [],
  };

  const open = jobs.filter((j) => j.is_open);
  const matched = matchJobs(jobs, prefs);
  const companies = new Set(open.map((j) => j.company).filter(Boolean)).size;

  return NextResponse.json({
    totalJobs: jobs.length,
    openJobs: open.length,
    companies,
    withEmail: open.filter((j) => j.apply_email).length,
    matches: matched.length,
    applicationsSent: apps.filter((a: { status: string }) => a.status === "sent").length,
    appliedToday: today,
    dailyCap: effectiveCap(profile),
    emailReady: emailReady(creds),
    profileReady:
      !!profile?.full_name &&
      ((profile?.desired_titles.length ?? 0) +
        (profile?.desired_categories.length ?? 0) +
        (profile?.keywords.length ?? 0)) > 0,
    cvReady: !!profile?.cv_path,
  });
}
