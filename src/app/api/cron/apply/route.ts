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

  // Resumable paging: process onboarded users in id order, starting after the
  // caller-supplied cursor. The GitHub Actions worker loops this endpoint with the
  // returned `nextCursor` until `done`, so the whole base is processed across many
  // sub-60s calls — escaping the Hobby function-time ceiling. A lone Vercel-cron
  // call (no cursor) still works as a one-page fallback.
  const PAGE = 1000;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? "";

  let pq = admin.from("profiles").select("id, plan_id")
    .eq("onboarded", true).order("id", { ascending: true }).limit(PAGE);
  if (cursor) pq = pq.gt("id", cursor);
  const { data: profiles } = await pq;

  // Fetch the catalogue ONCE for this call (was re-fetched per user).
  const jobs = await fetchJobs(admin);

  const results: unknown[] = [];
  let processed = 0, stoppedEarly = false, lastId = cursor;
  for (const p of profiles ?? []) {
    if (Date.now() - startedAt > BUDGET_MS) { stoppedEarly = true; break; }
    try {
      const cap = PLANS[(p.plan_id as PlanId) ?? "free"]?.dailyApplyCap ?? 0;
      if (cap > 0) {                                // free tier: no auto-apply
        const creds = await fetchCreds(admin, p.id);
        if (emailReady(creds)) {                    // skip users without email
          processed++;
          const r = await autoApply(admin, p.id, undefined, jobs);
          if (r.attempted > 0 || r.sent > 0) results.push({ user: p.id, ...r });
        }
      }
    } catch (err) {
      // One user's failure must never abort the run for everyone else.
      results.push({ user: p.id, error: String((err as Error)?.message ?? err) });
    }
    lastId = p.id as string; // advance only after the user is handled
  }

  // done = we drained this page within budget AND the page wasn't full (no more rows).
  const pageLen = profiles?.length ?? 0;
  const done = !stoppedEarly && pageLen < PAGE;

  return NextResponse.json({
    ok: true, usersProcessed: processed, stoppedEarly, done,
    nextCursor: lastId, elapsedMs: Date.now() - startedAt, results,
  });
}
