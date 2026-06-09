import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchCreds, saveCreds } from "@/lib/data";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Never return the secret to the client — just whether one is set.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await fetchCreds(sb, user.id);
  return NextResponse.json({
    auth_method: creds?.method ?? "smtp",
    smtp_host: creds?.smtp_host ?? "smtp.gmail.com",
    smtp_port: creds?.smtp_port ?? 587,
    smtp_user: creds?.from_email ?? "",
    has_pass: !!creds?.secret_enc,
    smtp_verified: creds?.method !== "google" && !!creds?.verified,
    google_connected: creds?.method === "google" && !!creds?.google_refresh_enc,
    google_email: creds?.method === "google" ? (creds?.from_email ?? "") : "",
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
}

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const smtp_user = typeof body.smtp_user === "string" ? body.smtp_user.trim() : "";
  const smtp_host = typeof body.smtp_host === "string" ? body.smtp_host.trim() : "";
  const smtp_port = typeof body.smtp_port === "number" ? body.smtp_port : 587;
  const smtp_pass = typeof body.smtp_pass === "string" ? body.smtp_pass : "";

  await saveCreds(sb, user.id, {
    method: "smtp",
    from_email: smtp_user,
    smtp_host,
    smtp_port,
    verified: false,
    ...(smtp_pass ? { secret_enc: encrypt(smtp_pass) } : {}),
  });

  return NextResponse.json({ ok: true });
}
