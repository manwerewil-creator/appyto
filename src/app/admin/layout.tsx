import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Keep the control centre out of search engines / link previews. (It's also
// auth-gated, so crawlers are redirected away regardless.)
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

// Server-side gate: anyone who isn't a configured admin is bounced to the app.
// The /api/admin/* routes re-check independently (defence in depth), so the data
// is protected even if this layout is somehow bypassed.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");
  return <>{children}</>;
}
