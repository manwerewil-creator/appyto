import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Server-side gate: anyone who isn't a configured admin is bounced to the app.
// The /api/admin/* routes re-check independently (defence in depth), so the data
// is protected even if this layout is somehow bypassed.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");
  return <>{children}</>;
}
