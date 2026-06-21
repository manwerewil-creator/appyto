import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanId } from "@/lib/plans";
import { createPayment, createMobilePayment, type MobileMethod } from "@/lib/paynow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Paynow requires absolute http(s) URLs for return/result. APP_URL is often
// misconfigured (missing scheme, trailing slash, or empty), so normalise it and
// fall back to the real request origin. Guarantees an "https://host" base.
function resolveBase(req: NextRequest): string {
  const raw = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  if (raw) return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    plan_id?: PlanId; phone?: string; method?: MobileMethod;
  };
  const plan_id = body.plan_id as PlanId;
  const plan = PLANS[plan_id];
  if (!plan?.isPaid) {
    return NextResponse.json({ ok: false, error: "Not a paid plan." }, { status: 400 });
  }

  const reference = `APPYTO-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const base = resolveBase(req);
  const common = {
    reference,
    amountUsd: plan.priceUsd,
    authEmail: user.email!,
    returnUrl: `${base}/billing/return?ref=${reference}`,
    resultUrl: `${base}/api/billing/result`,
  };

  // Mobile money (EcoCash / OneMoney / InnBucks): in-app express checkout — the
  // payer approves a prompt on their phone, no redirect to Paynow's page.
  const ALLOWED_METHODS: MobileMethod[] = ["ecocash", "onemoney", "innbucks", "telecash"];
  const useMobile = !!body.phone && !!body.method;
  if (useMobile && !ALLOWED_METHODS.includes(body.method as MobileMethod)) {
    return NextResponse.json({ ok: false, error: "Unsupported payment method." }, { status: 400 });
  }

  try {
    let pollUrl: string;
    let payload: Record<string, unknown>;

    if (useMobile) {
      const r = await createMobilePayment({ ...common, phone: body.phone!, method: body.method! });
      pollUrl = r.pollUrl;
      payload = { ok: true, mode: "mobile", reference, instructions: r.instructions };
    } else {
      const r = await createPayment(common);
      pollUrl = r.pollUrl;
      payload = { ok: true, mode: "web", reference, redirectUrl: r.redirectUrl };
    }

    await supabaseAdmin().from("payments").insert({
      user_id: user.id,
      plan_id,
      amount_usd: plan.priceUsd,
      reference,
      paynow_poll_url: pollUrl,
      status: "created",
    });

    return NextResponse.json(payload);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Payment could not be started.";
    return NextResponse.json({ ok: false, error });
  }
}
