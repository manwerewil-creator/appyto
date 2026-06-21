import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { upsertJob } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Save a job the user found themselves (pasted in). It becomes a real job in the
// store so we can apply to it and log the application like any other. RLS blocks
// user writes to jobs, so insert via the service-role client.
export async function POST(req: NextRequest) {
  const { user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 }); }
  if (!b?.apply_email || typeof b.apply_email !== "string") {
    return NextResponse.json({ ok: false, error: "An employer email is required." }, { status: 400 });
  }

  const suffix = Date.now().toString(36);
  const job: Job = {
    id: `custom:${user.id}:${suffix}`,
    source: "custom",
    source_uid: suffix,
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
  await upsertJob(supabaseAdmin(), job);
  return NextResponse.json({ ok: true, job });
}
