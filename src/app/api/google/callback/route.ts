import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { saveCreds } from "@/lib/data";
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

  await saveCreds(sb, user.id, {
    method: "google",
    from_email: emailFromIdToken(tokens.id_token) ?? "",
    google_refresh_enc: encrypt(tokens.refresh_token),
    verified: true,
  });

  return NextResponse.redirect(`${origin}/settings?google=connected`);
}
