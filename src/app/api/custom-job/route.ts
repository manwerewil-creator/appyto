import { NextRequest, NextResponse } from "next/server";
import { upsertJobs } from "@/lib/db";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Save a job the user found themselves (pasted in). It becomes a real job in the
// store so we can apply to it and log the application like any other.
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.apply_email) return NextResponse.json({ ok: false, error: "An employer email is required." }, { status: 400 });

  const uid = `${Date.now().toString(36)}`;
  const job: Job = {
    id: `custom:${uid}`,
    source: "custom",
    source_uid: uid,
    url: b.url || "",
    title: b.title || "Pasted job",
    company: b.company || null,
    location: b.location || null,
    category: b.category || "Custom",
    job_type: b.job_type || null,
    tags: [],
    description: b.description || "",
    apply_email: String(b.apply_email).trim(),
    apply_url: null,
    apply_method: "email",
    salary: null,
    posted_at: new Date().toISOString(),
    closes_at: null,
    is_open: true,
  };
  await upsertJobs([job]);
  return NextResponse.json({ ok: true, job });
}
