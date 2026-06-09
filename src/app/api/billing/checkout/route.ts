import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanId } from "@/lib/plans";
import { createPayment } from "@/lib/paynow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan_id?: PlanId };
  const plan_id = body.plan_id as PlanId;
  const plan = PLANS[plan_id];
  if (!plan?.isPaid) {
    return NextResponse.json({ ok: false, error: "Not a paid plan." }, { status: 400 });
  }

  const reference = `APPYTO-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const base = process.env.APP_URL || req.nextUrl.origin;

  try {
    const { redirectUrl, pollUrl } = await createPayment({
      reference,
      amountUsd: plan.priceUsd,
      authEmail: user.email!,
      returnUrl: `${base}/billing/return?ref=${reference}`,
      resultUrl: `${base}/api/billing/result`,
    });

    await supabaseAdmin().from("payments").insert({
      user_id: user.id,
      plan_id,
      amount_usd: plan.priceUsd,
      reference,
      paynow_poll_url: pollUrl,
      status: "created",
    });

    return NextResponse.json({ ok: true, redirectUrl });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Payment could not be started.";
    return NextResponse.json({ ok: false, error });
  }
}
