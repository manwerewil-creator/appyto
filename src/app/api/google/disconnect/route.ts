import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { saveCreds } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await saveCreds(sb, user.id, {
    method: "smtp",
    google_refresh_enc: null,
    verified: false,
  });

  return NextResponse.json({ ok: true });
}
