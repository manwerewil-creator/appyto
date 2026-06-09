import { NextResponse } from "next/server";
import { saveSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await saveSettings({
    auth_method: "smtp",
    google_connected: false,
    google_refresh_token: "",
    google_email: "",
  });
  return NextResponse.json({ ok: true });
}
