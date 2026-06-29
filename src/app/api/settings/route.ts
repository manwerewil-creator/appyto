import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchCreds } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sending is Gmail-only (the user connects their own inbox via OAuth). This just
// reports whether they've connected, plus whether the owner has configured the
// Google client at all. The refresh token is never sent to the client.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await fetchCreds(sb, user.id);
  return NextResponse.json({
    google_connected: creds?.method === "google" && !!creds?.google_refresh_enc,
    google_email: creds?.method === "google" ? (creds?.from_email ?? "") : "",
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
}
