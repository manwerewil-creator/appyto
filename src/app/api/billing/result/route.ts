import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanId } from "@/lib/plans";
import { pollStatus } from "@/lib/paynow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public server-to-server callback — Paynow POSTs the transaction status here.
// No auth: we trust the reference + a fresh poll of Paynow to confirm payment.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const reference = params.get("reference") || params.get("Reference") || "";
  if (!reference) return new Response("ok");

  const admin = supabaseAdmin();
  const { data: pay } = await admin
    .from("payments")
    .select()
    .eq("reference", reference)
    .maybeSingle();

  if (pay) {
    const { paid } = await pollStatus(pay.paynow_poll_url);
    if (paid) {
      const now = new Date().toISOString();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const planId = pay.plan_id as PlanId;

      await admin
        .from("payments")
        .update({ status: "paid", paid_at: now })
        .eq("reference", reference);

      await admin
        .from("subscriptions")
        .upsert(
          { user_id: pay.user_id, plan_id: pay.plan_id, status: "active", period_end: periodEnd },
          { onConflict: "user_id" }
        );

      await admin
        .from("profiles")
        .update({ plan_id: pay.plan_id, daily_cap: PLANS[planId].dailyApplyCap })
        .eq("id", pay.user_id);
    }
  }

  return new Response("ok");
}
