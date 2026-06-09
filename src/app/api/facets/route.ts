import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Distinct categories / locations / types for the filter dropdowns.
export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobs = await fetchJobs(sb);
  const count = (key: "category" | "location" | "job_type") => {
    const m = new Map<string, number>();
    for (const j of jobs) {
      const v = j[key];
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, n }));
  };
  return NextResponse.json({
    categories: count("category"),
    locations: count("location"),
    types: count("job_type"),
    totalOpen: jobs.length,
  });
}
