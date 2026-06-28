import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { confirmVbPayment } from "@/lib/vb/pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Paynow server-to-server callback (form-encoded). We re-poll Paynow to verify
// before granting, so this just needs the reference. Public (see middleware).
export async function POST(req: NextRequest) {
  let reference = "";
  try {
    reference = new URLSearchParams(await req.text()).get("reference") || "";
  } catch { /* ignore */ }
  if (reference) {
    try { await confirmVbPayment(supabaseAdmin(), reference); } catch { /* ignore */ }
  }
  return new NextResponse("ok");
}
