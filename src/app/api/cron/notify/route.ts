import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity, type ProfileRow } from "@/lib/data";
import { matchJobs } from "@/lib/match";
import { sendPushToUser } from "@/lib/push";
import type { Job, JobPreferences } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // honored on Vercel Pro; Hobby hard-caps at 60s.

const APP = process.env.APP_URL || "https://www.feasters.cloud";
// Bow out before the Hobby 60s ceiling. Users not reached keep their watermark,
// so they're simply picked up on the next run — nothing is lost.
const BUDGET_MS = Number(process.env.CRON_NOTIFY_BUDGET_MS ?? 52_000);

function prefsOf(p: ProfileRow): JobPreferences {
  return {
    desired_titles: p.desired_titles ?? [],
    desired_categories: p.desired_categories ?? [],
    desired_locations: p.desired_locations ?? [],
    desired_job_types: p.desired_job_types ?? [],
    keywords: p.keywords ?? [],
  };
}
const hasPrefs = (pr: JobPreferences) =>
  pr.desired_titles.length + pr.desired_categories.length + pr.keywords.length > 0;

/**
 * Push "N new jobs match you" to every subscribed user. Vercel Cron calls this
 * with `Authorization: Bearer <CRON_SECRET>`. For each user we look at jobs
 * scraped since their watermark, score them against their prefs, and push +
 * log when there are matches — then advance the watermark.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date().toISOString();
  const startedAt = Date.now();

  // Only users who actually have a push subscription are worth processing.
  const { data: subRows } = await admin.from("push_subscriptions").select("user_id");
  const userIds = [...new Set((subRows ?? []).map((r) => r.user_id as string))];

  let notified = 0;
  let stoppedEarly = false;
  const results: { user: string; newJobs: number; delivered: number }[] = [];

  for (const userId of userIds) {
    if (Date.now() - startedAt > BUDGET_MS) { stoppedEarly = true; break; }
    try {
    const { data: profile } = await admin
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!profile || !profile.onboarded) continue;

    const prefs = prefsOf(profile as ProfileRow);
    if (!hasPrefs(prefs)) continue;

    const watermark = (profile as ProfileRow & { jobs_notified_at?: string }).jobs_notified_at;

    // First run for this user: set the baseline, don't blast a backlog.
    if (!watermark) {
      await admin.from("profiles").update({ jobs_notified_at: now }).eq("id", userId);
      continue;
    }

    const { data: rawJobs } = await admin
      .from("jobs").select("*")
      .eq("is_open", true).gt("scraped_at", watermark)
      .order("scraped_at", { ascending: false }).limit(500);

    const matches = matchJobs((rawJobs ?? []) as Job[], prefs);

    if (matches.length > 0) {
      const top = matches[0];
      const body = matches.length === 1
        ? `${top.title}${top.company ? ` · ${top.company}` : ""}`
        : `${matches.length} new jobs match your profile — incl. ${top.title}`;
      const delivered = await sendPushToUser(admin, userId, {
        title: matches.length === 1 ? "New job for you" : `${matches.length} new jobs for you`,
        body,
        url: `${APP}/matches`,
        tag: "new-jobs",
      });
      await logActivity(admin, userId, "new_matches",
        matches.length === 1
          ? `New job match: ${top.title}`
          : `${matches.length} new jobs match your profile`,
        { count: matches.length });
      if (delivered > 0) notified++;
      results.push({ user: userId, newJobs: matches.length, delivered });
    }

    await admin.from("profiles").update({ jobs_notified_at: now }).eq("id", userId);
    } catch (err) {
      // Isolate per-user failures so one bad row can't abort the whole run.
      results.push({ user: userId, newJobs: 0, delivered: 0, error: String((err as Error)?.message ?? err) } as never);
    }
  }

  return NextResponse.json({ ok: true, usersChecked: userIds.length, notified, stoppedEarly, results });
}
