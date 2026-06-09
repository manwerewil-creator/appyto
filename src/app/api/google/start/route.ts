import { NextRequest, NextResponse } from "next/server";
import { googleConfigured, authUrl } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/settings?google=notconfigured`);
  }
  return NextResponse.redirect(authUrl(origin, "appyto"));
}
