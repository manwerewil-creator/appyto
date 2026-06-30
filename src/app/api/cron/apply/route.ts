import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchCreds, fetchJobs } from "@/lib/data";
import { emailReady } from "@/lib/mailer";
import { autoApply } from "@/lib/apply";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // honored on Vercel Pro; Hobby hard-caps at 60s.

// How long the run is allowed to spend before bowing out cleanly. Kept under the
// Hobby 60s function ceiling so we always return a useful summary instead of being
// killed mid-send. Raise via env once on Vercel Pro (300s functions).
const BUDGET_MS = Number(process.env.CRON_APPLY_BUDGET_MS ?? 52_000);

// Hands-off daily auto-apply. Vercel Cron calls this with
// `Authorization: Bearer <CRON_SECRET>`. Runs as the service role (no user
// session), so it can act on every eligible user.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const admin = supabaseAdmin();

  // Fetch the catalogue ONCE for the whole run (was re-fetched per user).
  const jobs = await fetchJobs(admin);

  const { data: profiles } = await admin
    .from("profiles").select("id, plan_id").eq("onboarded", true);

  const results: unknown[] = [];
  let processed = 0, stoppedEarly = false;
  for (const p of profiles ?? []) {
    if (Date.now() - startedAt > BUDGET_MS) { stoppedEarly = true; break; }
    try {
      const cap = PLANS[(p.plan_id as PlanId) ?? "free"]?.dailyApplyCap ?? 0;
      if (cap <= 0) continue;                       // free tier: no auto-apply
      const creds = await fetchCreds(admin, p.id);
      if (!emailReady(creds)) continue;             // hasn't connected email
      processed++;
      const r = await autoApply(admin, p.id, undefined, jobs);
      if (r.attempted > 0 || r.sent > 0) results.push({ user: p.id, ...r });
    } catch (err) {
      // One user's failure must never abort the run for everyone else.
      results.push({ user: p.id, error: String((err as Error)?.message ?? err) });
    }
  }

  // NOTE: a single daily ≤60s (Hobby) invocation cannot send for many users
  // sequentially (~4-6s/email). `stoppedEarly` flags when the budget bounded the
  // run — the real fix is an off-Vercel send worker (see audit). Until then this
  // degrades gracefully instead of being killed mid-flight.
  return NextResponse.json({
    ok: true, usersProcessed: processed, stoppedEarly,
    elapsedMs: Date.now() - startedAt, results,
  });
}
