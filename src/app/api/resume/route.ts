import { NextRequest, NextResponse } from "next/server";
import { getResume, saveResume, getProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getResume());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Trust the client's full resume object (single-user local app); persist it.
  const saved = await saveResume(body);
  return NextResponse.json({ ok: true, resume: saved });
}

// Prefill convenience: pull what we already know from the profile.
export async function PUT() {
  const p = await getProfile();
  const patch = {
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    headline: p.desired_titles[0] ?? "",
    location: p.desired_locations[0] ?? "",
  };
  const saved = await saveResume(patch);
  return NextResponse.json({ ok: true, resume: saved });
}
