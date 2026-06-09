import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchCreds } from "@/lib/data";
import { emailReady } from "@/lib/mailer";
import { autoApply } from "@/lib/apply";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Hands-off daily auto-apply. Vercel Cron calls this with
// `Authorization: Bearer <CRON_SECRET>`. Runs as the service role (no user
// session), so it can act on every eligible user.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data: profiles } = await admin
    .from("profiles").select("id, plan_id").eq("onboarded", true);

  const results: unknown[] = [];
  for (const p of profiles ?? []) {
    const cap = PLANS[(p.plan_id as PlanId) ?? "free"]?.dailyApplyCap ?? 0;
    if (cap <= 0) continue;                         // free tier: no auto-apply
    const creds = await fetchCreds(admin, p.id);
    if (!emailReady(creds)) continue;               // hasn't connected email
    const r = await autoApply(admin, p.id);
    if (r.attempted > 0 || r.sent > 0) results.push({ user: p.id, ...r });
  }

  return NextResponse.json({ ok: true, usersProcessed: results.length, results });
}
