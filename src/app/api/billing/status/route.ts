import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { confirmPayment } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ref = req.nextUrl.searchParams.get("ref") || "";
  const admin = supabaseAdmin();

  // Confirm ownership, then poll Paynow directly + activate the plan if paid.
  const { data: pay } = await admin
    .from("payments").select("user_id, status").eq("reference", ref).maybeSingle();
  if (!pay || pay.user_id !== user.id) return NextResponse.json({ status: null });

  const { status } = await confirmPayment(admin, ref);
  return NextResponse.json({ status: status === "unknown" ? (pay.status ?? null) : status });
}
