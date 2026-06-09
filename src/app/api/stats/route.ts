import { NextResponse } from "next/server";
import { getJobs, getProfile, getApplications, getSettings, appliedToday } from "@/lib/db";
import { matchJobs } from "@/lib/match";
import { emailReady } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Numbers for the Overview dashboard.
export async function GET() {
  const [jobs, profile, apps, settings] = await Promise.all([
    getJobs(), getProfile(), getApplications(), getSettings(),
  ]);
  const open = jobs.filter((j) => j.is_open);
  const matched = matchJobs(jobs, profile);
  const companies = new Set(open.map((j) => j.company).filter(Boolean)).size;

  return NextResponse.json({
    totalJobs: jobs.length,
    openJobs: open.length,
    companies,
    withEmail: open.filter((j) => j.apply_email).length,
    matches: matched.length,
    applicationsSent: apps.filter((a) => a.status === "sent").length,
    appliedToday: await appliedToday(),
    dailyCap: profile.daily_cap,
    emailReady: emailReady(settings),
    profileReady:
      !!profile.full_name &&
      (profile.desired_titles.length + profile.desired_categories.length + profile.keywords.length) > 0,
    cvReady: !!profile.cv_filename,
  });
}
