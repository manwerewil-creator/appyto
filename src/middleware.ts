// Refreshes the Supabase auth session on every request and gates the app.
// Unauthenticated users are bounced to /login (except public paths + auth/api).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/welcome", "/login", "/privacy", "/terms", "/auth", "/api/google", "/api/billing/result", "/billing/return", "/api/cron", "/api/analytics"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p));

  // Unauthenticated users meet the Get Started screen first (which leads to /login).
  if (!user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome";
    return NextResponse.redirect(url);
  }
  // Signed-in users have no use for the Get Started screen — send them to the app.
  if (user && path === "/welcome") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  // Run on everything except static assets (incl. image/font files like logo.png,
  // icon.png — otherwise unauthenticated asset requests get redirected to /login).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
