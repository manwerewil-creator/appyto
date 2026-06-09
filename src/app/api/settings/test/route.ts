import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { verifyTransport } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verifies the saved SMTP credentials by opening a real connection + auth.
export async function POST() {
  const s = await getSettings();
  if (!s.smtp_user || !s.smtp_pass) {
    return NextResponse.json({ ok: false, error: "Enter your email address and app password first." }, { status: 400 });
  }
  const result = await verifyTransport(s);
  await saveSettings({ smtp_verified: result.ok });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
