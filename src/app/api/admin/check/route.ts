import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tiny endpoint the app shell uses to decide whether to show the Admin nav link.
// Reveals nothing beyond a boolean — the admin email list never reaches the client.
export async function GET() {
  const admin = await getAdminUser();
  return NextResponse.json({ admin: !!admin });
}
