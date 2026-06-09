import { NextResponse } from "next/server";
import { getApplications, appliedToday } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getApplications();
  return NextResponse.json({
    items,
    sent: items.filter((a) => a.status === "sent").length,
    failed: items.filter((a) => a.status === "failed").length,
    today: await appliedToday(),
  });
}
