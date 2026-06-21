import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VID = "fx_vid"; // anonymous per-device visitor id (httpOnly cookie)

// Lightweight page-view beacon. Accepts anonymous AND signed-in visitors (it's
// listed as a public path in middleware so logged-out hits aren't bounced).
// Writes via the service role into analytics_events (RLS-locked from users).
export async function POST(req: NextRequest) {
  let body: { path?: string; ref?: string; event?: string } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const path = typeof body.path === "string" ? body.path.slice(0, 512) : null;
  const referrer = typeof body.ref === "string" && body.ref ? body.ref.slice(0, 512) : null;
  const event = typeof body.event === "string" ? body.event.slice(0, 64) : "page_view";

  // Reuse the visitor cookie or mint a new one (set on the response below).
  let vid = req.cookies.get(VID)?.value ?? null;
  const isNew = !vid;
  if (!vid) vid = globalThis.crypto.randomUUID();

  // Best-effort: attach the signed-in user if there is a session.
  let userId: string | null = null;
  try {
    const { user } = await getAuth();
    userId = user?.id ?? null;
  } catch { /* anon */ }

  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  try {
    await supabaseAdmin().from("analytics_events").insert({
      visitor_id: vid, user_id: userId, event, path, referrer, user_agent: ua,
    });
  } catch { /* never let telemetry break navigation */ }

  const res = NextResponse.json({ ok: true });
  if (isNew) {
    res.cookies.set(VID, vid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  return res;
}
