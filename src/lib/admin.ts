// Admin access control. The set of admins is configured ENTIRELY in the backend
// via the ADMIN_EMAILS env var (comma/space/newline separated) — never exposed
// to the client. Gate the /admin page and every /api/admin/* route with these.
//
//   ADMIN_EMAILS="you@example.com, partner@example.com"
//
import { getAuth } from "./auth";

const RAW = process.env.ADMIN_EMAILS ?? "";

export const ADMIN_EMAILS = new Set(
  RAW.split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean),
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
