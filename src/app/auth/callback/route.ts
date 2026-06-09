import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMP DIAGNOSTIC LOGGING — remove once the login issue is fixed.
const LOG = join(tmpdir(), "featers-auth.log");
function dbg(...parts: unknown[]) {
  try {
    appendFileSync(LOG, parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(" ") + "\n");
  } catch {}
}

// OAuth callback. We MUST write the session cookies onto the actual redirect
// response — collecting them as Supabase emits them, then attaching them to the
// final NextResponse — otherwise the session is lost and the user bounces back
// to /login.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  dbg("\n=== callback hit ===", new Date().toISOString());
  dbg("origin:", origin);
  dbg("incoming cookies:", req.cookies.getAll().map((c) => c.name));
  dbg("code present:", !!code, "oauthError:", oauthError ?? "none");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("No authorization code returned")}`);
  }

  const pending: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) =>
          pending.push(...(toSet as typeof pending)),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    dbg("EXCHANGE FAILED:", error.message, "status:", (error as any).status);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }
  dbg("exchange OK, cookies to set:", pending.map((p) => p.name));
  dbg("cookie options sample:", pending[0]?.options ?? "none");

  // Decide where to send the user.
  const { data: { user } } = await supabase.auth.getUser();
  dbg("getUser after exchange:", user ? user.id : "NULL");
  let dest = "/onboarding";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    dest = profile?.onboarded ? "/" : "/onboarding";
  }
  dbg("redirecting to:", dest);

  const res = NextResponse.redirect(`${origin}${dest}`);
  for (const { name, value, options } of pending) res.cookies.set(name, value, options as any);
  return res;
}
