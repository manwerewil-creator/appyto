import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchProfile, saveProfile } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STR_ARRAYS = [
  "work_modes", "desired_titles", "desired_categories",
  "desired_locations", "desired_job_types", "keywords",
] as const;

export async function GET() {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const p = await fetchProfile(sb, user.id);
  const cv_path = p?.cv_path ?? null;
  return NextResponse.json({
    full_name: p?.full_name ?? "",
    email: p?.email ?? "",
    phone: p?.phone ?? "",
    qualifications: p?.qualifications ?? "",
    work_modes: p?.work_modes ?? [],
    desired_titles: p?.desired_titles ?? [],
    desired_categories: p?.desired_categories ?? [],
    desired_locations: p?.desired_locations ?? [],
    desired_job_types: p?.desired_job_types ?? [],
    keywords: p?.keywords ?? [],
    cover_letter_template: p?.cover_letter_template ?? "",
    daily_cap: p?.daily_cap ?? 0,
    onboarded: p?.onboarded ?? false,
    cv_filename: cv_path ? cv_path.split("/").pop() : null,
    resources: p?.resources ?? [],
    resource_files: p?.resource_files ?? [],
  });
}

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  for (const k of ["full_name", "email", "phone", "qualifications", "cover_letter_template"] as const) {
    if (typeof body[k] === "string") patch[k] = body[k];
  }
  if (typeof body.daily_cap === "number") {
    patch.daily_cap = Math.max(0, Math.min(500, body.daily_cap));
  }
  if (typeof body.onboarded === "boolean") patch.onboarded = body.onboarded;
  for (const k of STR_ARRAYS) {
    if (Array.isArray(body[k])) {
      patch[k] = (body[k] as unknown[]).map((s) => String(s).trim()).filter(Boolean);
    }
  }

  // Extra application links: sanitize to [{label,url}] with non-empty URLs.
  if (Array.isArray(body.resources)) {
    patch.resources = (body.resources as unknown[])
      .map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return { label: String(o.label ?? "").trim(), url: String(o.url ?? "").trim() };
      })
      .filter((r) => r.url);
  }

  const profile = await saveProfile(sb, user.id, patch);
  return NextResponse.json({ ok: true, profile });
}
