import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobById, fetchProfile } from "@/lib/data";
import { buildEmail } from "@/lib/mailer";
import { detectRequirements } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the engine-generated draft (subject + body) for a job, plus what the
// employer was detected to ask for, so the user can review before sending.
// Pure algorithmic generation — no LLM.
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
  const requirements = detectRequirements(job);

  // What will physically ride along with the email, so the preview can show it.
  const attachments: { name: string; kind: string }[] = [];
  const kindOf = (n: string) => (n.split(".").pop() || "file").toLowerCase();
  if (profile?.cv_path) {
    const name = profile.cv_path.split("/").pop() || "CV.pdf";
    attachments.push({ name, kind: kindOf(name) });
  }
  for (const f of profile?.resource_files ?? []) {
    attachments.push({ name: f.name, kind: kindOf(f.name) });
  }
  const links = profile?.resources ?? [];

  return NextResponse.json({ ok: true, subject, body, to: job.apply_email, requirements, attachments, links });
}
