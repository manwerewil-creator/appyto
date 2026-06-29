import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchProfile, sentApplicationsCount } from "@/lib/data";
import { PLANS, sendLimitOf, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Everything the apply UI needs in one call: the user's plan, their send
// preference (auto vs review), and — for free tiers — how many of their free
// applications remain. `limit`/`remaining` are null for unlimited (paid) plans.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await fetchProfile(sb, user.id);
  const planId = ((profile?.plan_id as PlanId) ?? "free") as PlanId;
  const limit = sendLimitOf(planId);
  const used = limit == null ? 0 : await sentApplicationsCount(sb, user.id);
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return NextResponse.json({
    planId,
    isPaid: !!PLANS[planId]?.isPaid,
    autoSend: profile?.auto_send ?? false,
    limit,
    used,
    remaining,
    blocked: limit != null && used >= limit,
  });
}
