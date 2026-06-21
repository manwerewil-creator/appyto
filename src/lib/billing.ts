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
  const cap = PLANS[planId].dailyApplyCap;

  // Order matters: GRANT the plan first (this is what unlocks features), then
  // record the subscription, and only mark the payment "paid" LAST. If we marked
  // it paid first and a later write failed, the next poll would short-circuit on
  // status==="paid" and the user would never get what they paid for. All writes
  // are idempotent, so a retry safely re-runs until everything lands.
  const { error: profileErr } = await admin
    .from("profiles").update({ plan_id: planId, daily_cap: cap }).eq("id", pay.user_id);
  if (profileErr) throw new Error(`Could not activate plan: ${profileErr.message}`);

  await admin.from("subscriptions").upsert(
    { user_id: pay.user_id, plan_id: planId, status: "active", period_end: periodEnd },
    { onConflict: "user_id" },
  );

  await admin.from("payments")
    .update({ status: "paid", paid_at: now }).eq("reference", reference);

  // Non-critical: never let a feed-logging hiccup undo a successful upgrade.
  try {
    await logActivity(admin, pay.user_id, "plan_upgraded",
      `Upgraded to ${PLANS[planId].name} — $${pay.amount_usd}/mo`,
      { plan_id: planId, amount_usd: pay.amount_usd, reference });
  } catch { /* ignore */ }

  return { status: "paid" };
}
