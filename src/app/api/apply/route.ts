import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { applyToJob } from "@/lib/apply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { job_id, custom_subject, custom_body } = await req.json();
  if (!job_id) return NextResponse.json({ ok: false, reason: "job_id required" }, { status: 400 });

  const override =
    custom_subject || custom_body ? { subject: custom_subject, body: custom_body } : undefined;
  const r = await applyToJob(sb, user.id, String(job_id), override);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
