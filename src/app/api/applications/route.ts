import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchApplications, appliedToday } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await fetchApplications(sb, user.id);
  return NextResponse.json({
    items,
    sent: items.filter((a) => a.status === "sent").length,
    failed: items.filter((a) => a.status === "failed").length,
    today: await appliedToday(sb, user.id),
  });
}
