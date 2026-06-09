import { NextRequest, NextResponse } from "next/server";
import { applyToJob } from "@/lib/apply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { job_id, custom_subject, custom_body } = await req.json();
  if (!job_id) return NextResponse.json({ ok: false, reason: "job_id required" }, { status: 400 });
  const override =
    custom_subject || custom_body ? { subject: custom_subject, body: custom_body } : undefined;
  const outcome = await applyToJob(String(job_id), override);
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 400 });
}
