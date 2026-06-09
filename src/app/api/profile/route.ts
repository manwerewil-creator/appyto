import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/db";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getProfile());
}

const STR_ARRAYS: (keyof Profile)[] = [
  "desired_titles", "desired_categories", "desired_locations", "desired_job_types", "keywords", "work_modes",
];

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Profile>;
  const patch: Partial<Profile> = {};

  for (const k of ["full_name", "email", "phone", "cover_letter_template", "cv_filename", "qualifications"] as const) {
    if (typeof body[k] === "string") (patch as any)[k] = body[k];
  }
  if (typeof body.daily_cap === "number") patch.daily_cap = Math.max(0, Math.min(500, body.daily_cap));
  if (typeof body.onboarded === "boolean") patch.onboarded = body.onboarded;
  for (const k of STR_ARRAYS) {
    if (Array.isArray(body[k])) {
      (patch as any)[k] = (body[k] as string[]).map((s) => String(s).trim()).filter(Boolean);
    }
  }
  const saved = await saveProfile(patch);
  return NextResponse.json({ ok: true, profile: saved });
}
