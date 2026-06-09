import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchCreds, saveCreds, logActivity } from "@/lib/data";
import { credsToConfig, verifyConfig } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verifies the saved SMTP credentials by opening a real connection + auth.
export async function POST() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await fetchCreds(sb, user.id);
  if (!creds?.secret_enc || !creds?.from_email) {
    return NextResponse.json(
      { ok: false, error: "Enter your email and app password first." },
      { status: 400 }
    );
  }

  const cfg = credsToConfig(creds);
  const r = await verifyConfig(cfg);
  if (r.ok) {
    await saveCreds(sb, user.id, { verified: true });
    await logActivity(sb, user.id, "email_connected",
      `Connected sending email (${creds.from_email})`, { method: "smtp", from_email: creds.from_email });
  }
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
