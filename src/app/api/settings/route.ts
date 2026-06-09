import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Never return the password to the client — just whether one is set.
export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    auth_method: s.auth_method,
    smtp_host: s.smtp_host,
    smtp_port: s.smtp_port,
    smtp_user: s.smtp_user,
    has_pass: !!s.smtp_pass,
    smtp_verified: s.smtp_verified,
    google_connected: s.google_connected,
    google_email: s.google_email,
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.smtp_host === "string") patch.smtp_host = body.smtp_host.trim();
  if (typeof body.smtp_port === "number") patch.smtp_port = body.smtp_port;
  if (typeof body.smtp_user === "string") patch.smtp_user = body.smtp_user.trim();
  // Only overwrite the password if a non-empty one is provided.
  if (typeof body.smtp_pass === "string" && body.smtp_pass.length) patch.smtp_pass = body.smtp_pass;
  // Saving SMTP details switches the active method to SMTP and invalidates
  // prior verification until re-tested.
  patch.auth_method = "smtp";
  patch.smtp_verified = false;
  const saved = await saveSettings(patch);
  return NextResponse.json({
    ok: true,
    settings: { ...saved, smtp_pass: undefined, has_pass: !!saved.smtp_pass },
  });
}
