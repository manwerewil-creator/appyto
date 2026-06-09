import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, emailFromIdToken } from "@/lib/google";
import { saveSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const sp = req.nextUrl.searchParams;

  if (sp.get("error")) {
    return NextResponse.redirect(`${origin}/settings?google=denied`);
  }
  const code = sp.get("code");
  if (!code) return NextResponse.redirect(`${origin}/settings?google=error`);

  const tokens = await exchangeCode(code, origin);
  if (tokens.error || !tokens.refresh_token) {
    // No refresh_token usually means the user already granted before without
    // revoking; prompt=consent should prevent this, but guard anyway.
    return NextResponse.redirect(`${origin}/settings?google=norefresh`);
  }
  const email = emailFromIdToken(tokens.id_token) ?? "";

  await saveSettings({
    auth_method: "google",
    google_email: email,
    google_refresh_token: tokens.refresh_token,
    google_connected: true,
  });

  return NextResponse.redirect(`${origin}/settings?google=connected`);
}
