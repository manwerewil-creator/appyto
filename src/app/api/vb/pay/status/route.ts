import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { confirmVbPayment } from "@/lib/vb/pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client poll: confirms ownership, then polls Paynow + grants access if paid.
export async function GET(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ref = req.nextUrl.searchParams.get("ref") || "";
  const admin = supabaseAdmin();
  const { data: pay } = await admin
    .from("vb_payments").select("student_id, status").eq("reference", ref).maybeSingle();
  if (!pay || pay.student_id !== user.id) return NextResponse.json({ status: null });

  const { status } = await confirmVbPayment(admin, ref);
  return NextResponse.json({ status: status === "unknown" ? (pay.status ?? null) : status });
}
