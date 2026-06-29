import { NextRequest, NextResponse } from "next/server";
import { googleConfigured, authUrl } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kicks off the "Connect Gmail" OAuth flow. `?next=` is where the user should
// land afterwards (e.g. /settings or /onboarding); we carry it through the OAuth
// `state` and the callback redirects back there. Only same-site paths allowed.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const nextParam = req.nextUrl.searchParams.get("next") || "/settings";
  const next = nextParam.startsWith("/") ? nextParam : "/settings";

  if (!googleConfigured()) {
    const sep = next.includes("?") ? "&" : "?";
    return NextResponse.redirect(`${origin}${next}${sep}google=notconfigured`);
  }
  return NextResponse.redirect(authUrl(origin, next));
}
