import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchResume, saveResume, fetchProfile } from "@/lib/data";
import type { Resume } from "@/lib/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const resume = await fetchResume(sb, user.id);
  return NextResponse.json(resume);
}

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Resume;
  await saveResume(sb, user.id, body);
  const resume = await fetchResume(sb, user.id);
  return NextResponse.json({ ok: true, resume });
}

// Prefill convenience: pull what we already know from the profile.
export async function PUT() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const p = await fetchProfile(sb, user.id);
  const current = await fetchResume(sb, user.id);
  const merged: Resume = {
    ...current,
    full_name: p?.full_name ?? current.full_name,
    email: p?.email ?? current.email,
    phone: p?.phone ?? current.phone,
    headline: p?.desired_titles?.[0] ?? "",
    location: p?.desired_locations?.[0] ?? "",
  };
  await saveResume(sb, user.id, merged);
  const resume = await fetchResume(sb, user.id);
  return NextResponse.json({ ok: true, resume });
}
