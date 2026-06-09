import { NextRequest, NextResponse } from "next/server";
import { getJobs, getProfile } from "@/lib/db";
import { buildEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the code-generated draft (subject + body) for a job, so the user can
// edit it before sending. Pure template fill — no AI.
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job_id");
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()]);
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return NextResponse.json({ ok: false, error: "job not found" }, { status: 404 });
  const { subject, body } = buildEmail(job, profile);
  return NextResponse.json({ ok: true, subject, body, to: job.apply_email });
}
