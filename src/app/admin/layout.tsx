import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import AdminShell from "@/components/admin-shell";

export const dynamic = "force-dynamic";

// Keep the control centre out of search engines / link previews. (It's also
// auth-gated, so crawlers are redirected away regardless.)
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

// Server-side gate: the ONLY way past here is a signed-in session whose email is
// an owner (email + password — nothing else). Everyone else is bounced to the
// app. The /api/admin/* routes re-check independently (defence in depth), so the
// data stays protected even if this layout were somehow bypassed. The admin area
// renders in its own AdminShell — fully separate from the user dashboard.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");
  return <AdminShell email={admin.email ?? null}>{children}</AdminShell>;
}
