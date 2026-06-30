import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { applyToJob } from "@/lib/apply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "invalid request" }, { status: 400 }); }
  const { job_id, custom_subject, custom_body } = body ?? {};
  if (typeof job_id !== "string" || !job_id) return NextResponse.json({ ok: false, reason: "job_id required" }, { status: 400 });

  const override =
    custom_subject || custom_body ? { subject: custom_subject, body: custom_body } : undefined;
  try {
    const r = await applyToJob(sb, user.id, job_id, override);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (e: unknown) {
    // Surface the real reason to the client instead of an opaque 500.
    const reason = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    return NextResponse.json({ ok: false, status: "failed", reason }, { status: 500 });
  }
}
