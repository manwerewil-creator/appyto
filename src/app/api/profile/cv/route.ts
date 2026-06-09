import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveProfile } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("cv");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "CV must be under 8MB" }, { status: 400 });
  }

  const safeName = (file.name || "cv.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const buffer = Buffer.from(await file.arrayBuffer());
  const cv_path = user.id + "/" + safeName;

  const { error } = await supabaseAdmin().storage.from("cvs").upload(cv_path, buffer, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await saveProfile(sb, user.id, { cv_path });
  return NextResponse.json({ ok: true, cv_filename: safeName });
}
