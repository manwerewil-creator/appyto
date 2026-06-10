import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { savePushSub } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Save the browser's push subscription for the signed-in user.
export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint as string | undefined;
  const p256dh = sub?.keys?.p256dh as string | undefined;
  const auth = sub?.keys?.auth as string | undefined;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "invalid subscription" }, { status: 400 });
  }

  await savePushSub(sb, user.id, { endpoint, p256dh, auth });
  return NextResponse.json({ ok: true });
}
