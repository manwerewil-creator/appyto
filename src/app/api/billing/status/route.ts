import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ref = req.nextUrl.searchParams.get("ref") || "";
  const { data: pay } = await supabaseAdmin()
    .from("payments")
    .select("status")
    .eq("reference", ref)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ status: pay?.status ?? null });
}
