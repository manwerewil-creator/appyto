import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  try {
    const sb = await supabaseServer();
    if (code) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }
    }

    const { data: userData } = await sb.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();

    const dest = profile?.onboarded ? "/" : "/onboarding";
    return NextResponse.redirect(`${origin}${dest}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
