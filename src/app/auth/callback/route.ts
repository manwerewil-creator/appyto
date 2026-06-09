import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OAuth callback. We MUST write the session cookies onto the actual redirect
// response — collecting them as Supabase emits them, then attaching them to the
// final NextResponse — otherwise the session is lost and the user bounces back
// to /login.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

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
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Decide where to send the user.
  const { data: { user } } = await supabase.auth.getUser();
  let dest = "/onboarding";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    dest = profile?.onboarded ? "/" : "/onboarding";
  }

  const res = NextResponse.redirect(`${origin}${dest}`);
  for (const { name, value, options } of pending) res.cookies.set(name, value, options as any);
  return res;
}
