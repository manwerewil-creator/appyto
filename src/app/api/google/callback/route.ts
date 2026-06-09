import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { saveCreds, logActivity } from "@/lib/data";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, emailFromIdToken } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  if (sp.get("error") || !code) {
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }

  const tokens = await exchangeCode(code, origin);
  if (tokens.error || !tokens.refresh_token) {
    return NextResponse.redirect(`${origin}/settings?google=norefresh`);
  }

  const fromEmail = emailFromIdToken(tokens.id_token) ?? "";
  await saveCreds(sb, user.id, {
    method: "google",
    from_email: fromEmail,
    google_refresh_enc: encrypt(tokens.refresh_token),
    verified: true,
  });
  await logActivity(sb, user.id, "email_connected",
    `Connected Gmail${fromEmail ? ` (${fromEmail})` : ""}`, { method: "google", from_email: fromEmail });

  return NextResponse.redirect(`${origin}/settings?google=connected`);
}
