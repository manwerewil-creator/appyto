import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobFacets } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Distinct categories / locations / types for the filter dropdowns. Pulls only
// the three facet columns (never the bulky description) so it stays cheap at scale.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await fetchJobFacets(sb));
}
