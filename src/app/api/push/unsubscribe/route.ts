import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { deletePushSub } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Forget a browser's push subscription (user turned notifications off).
export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));
  if (!endpoint) return NextResponse.json({ ok: false, error: "no endpoint" }, { status: 400 });

  // Delete by endpoint (RLS scopes it to this user's rows).
  await deletePushSub(sb, endpoint);
  return NextResponse.json({ ok: true });
}
