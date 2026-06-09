import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchActivity } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's recent activity (their app "memory").
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const events = await fetchActivity(sb, user.id, 30);
  return NextResponse.json({ events });
}
