// Shared payment-confirmation logic. Used by BOTH the server-to-server result
// callback (Paynow → /api/billing/result) and the client-driven status poll
// (/api/billing/status). Polling Paynow directly here means a payment is
// confirmed and the plan activated even when Paynow can't reach our result URL
// (e.g. local dev, or a missed callback).

import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, PlanId } from "./plans";
import { pollStatus } from "./paynow";
import { logActivity } from "./data";

export async function confirmPayment(
  admin: SupabaseClient,
  reference: string,
): Promise<{ status: "paid" | "pending" | "unknown" }> {
  if (!reference) return { status: "unknown" };

  const { data: pay } = await admin
    .from("payments").select().eq("reference", reference).maybeSingle();
  if (!pay) return { status: "unknown" };
  if (pay.status === "paid") return { status: "paid" };

  const { paid } = await pollStatus(pay.paynow_poll_url);
  if (!paid) return { status: "pending" };

  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const planId = pay.plan_id as PlanId;

  await admin.from("payments")
    .update({ status: "paid", paid_at: now }).eq("reference", reference);
  await admin.from("subscriptions").upsert(
    { user_id: pay.user_id, plan_id: pay.plan_id, status: "active", period_end: periodEnd },
    { onConflict: "user_id" },
  );
  await admin.from("profiles")
    .update({ plan_id: pay.plan_id, daily_cap: PLANS[planId].dailyApplyCap }).eq("id", pay.user_id);
  await logActivity(admin, pay.user_id, "plan_upgraded",
    `Upgraded to ${PLANS[planId].name} — $${pay.amount_usd}/mo`,
    { plan_id: pay.plan_id, amount_usd: pay.amount_usd, reference });

  return { status: "paid" };
}
