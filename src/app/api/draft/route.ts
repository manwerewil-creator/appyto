import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobById, fetchProfile } from "@/lib/data";
import { buildEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the code-generated draft (subject + body) for a job, so the user can
// edit it before sending. Pure template fill — no AI.
export async function GET(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobId = req.nextUrl.searchParams.get("job_id");
  const [job, profile] = await Promise.all([
    fetchJobById(sb, String(jobId)),
    fetchProfile(sb, user.id),
  ]);
  if (!job) return NextResponse.json({ ok: false, error: "job not found" }, { status: 404 });

  const { subject, body } = buildEmail(job, profile ?? {});
  return NextResponse.json({ ok: true, subject, body, to: job.apply_email });
}
