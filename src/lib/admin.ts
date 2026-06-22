// Admin access control. The set of admins is configured ENTIRELY in the backend
// via the ADMIN_EMAILS env var (comma/space/newline separated) — never exposed
// to the client. Gate the /admin page and every /api/admin/* route with these.
//
//   ADMIN_EMAILS="you@example.com, partner@example.com"
//
import { getAuth } from "./auth";

// The owners. Baked in so the dashboard is locked down even if the ADMIN_EMAILS
// env var is ever missing in an environment. Knowing an email grants nothing —
// access still requires a valid Supabase session (password) for that account.
const DEFAULT_ADMINS = [
  "ceo@rylolabz.com",
  "rylolabz@gmail.com",
  "tadiwamanwere@gmail.com",
];

// ADMIN_EMAILS (comma/space/newline separated) adds to — never replaces — the
// baked-in owners, so admins can be added later from Vercel without a deploy.
const RAW = process.env.ADMIN_EMAILS ?? "";

export const ADMIN_EMAILS = new Set(
  [...DEFAULT_ADMINS, ...RAW.split(/[,\s]+/)]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

// Returns the authenticated admin user, or null if not signed in / not an admin.
// Routes call this and 403 on null; the /admin layout redirects on null.
export async function getAdminUser() {
  const { user } = await getAuth();
  if (!user || !isAdmin(user.email)) return null;
  return user;
}
