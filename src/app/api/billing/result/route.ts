import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { confirmPayment } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public server-to-server callback — Paynow POSTs the transaction status here.
// No auth: we trust the reference + a fresh poll of Paynow to confirm payment.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const reference = params.get("reference") || params.get("Reference") || "";
  if (reference) await confirmPayment(supabaseAdmin(), reference);
  return new Response("ok");
}
