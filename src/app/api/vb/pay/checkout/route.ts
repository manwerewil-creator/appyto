import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createPayment, createMobilePayment, type MobileMethod } from "@/lib/paynow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STUDENT_FEE = 10;                         // USD, once-off
const MOBILE: MobileMethod[] = ["ecocash", "onemoney"];

// Paynow needs absolute http(s) URLs. Normalise APP_URL and fall back to origin.
function resolveBase(req: NextRequest): string {
  const raw = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  if (raw) return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return req.nextUrl.origin;
}

// Starts a real Paynow charge for the $10 student registration fee. Mobile money
// (EcoCash / OneMoney) uses express checkout (prompt on the phone); anything else
// uses Paynow's hosted page (card, etc).
export async function POST(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { method?: string; phone?: string };
  const method = (body.method ?? "card").toLowerCase();
  const base = resolveBase(req);
  const reference = `VB-${user.id.slice(0, 8)}-${Date.now().toString(36)}`.toUpperCase();
  const common = {
    reference,
    amountUsd: STUDENT_FEE,
    authEmail: user.email!,
    returnUrl: `${base}/pay/return?ref=${reference}`,
    resultUrl: `${base}/api/vb/pay/result`,
  };

  try {
    let pollUrl: string;
    let payload: Record<string, unknown>;

    if (MOBILE.includes(method as MobileMethod)) {
      const r = await createMobilePayment({ ...common, phone: body.phone ?? "", method: method as MobileMethod });
      pollUrl = r.pollUrl;
      payload = { ok: true, mode: "mobile", reference, instructions: r.instructions };
    } else {
      const r = await createPayment(common);
      pollUrl = r.pollUrl;
      payload = { ok: true, mode: "web", reference, redirectUrl: r.redirectUrl };
    }

    await supabaseAdmin().from("vb_payments").insert({
      student_id: user.id,
      amount: STUDENT_FEE,
      currency: "USD",
      method: method || "card",
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
