import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchProfile } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// What the apply UI needs in one call: the user's plan and their send
// preference (auto vs review). Billing is gone, so there is no allowance left
// to spend and nothing here can block an application.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await fetchProfile(sb, user.id);
  return NextResponse.json({
    planId: (profile?.plan_id as string) ?? "free",
    autoSend: profile?.auto_send ?? false,
  });
}
