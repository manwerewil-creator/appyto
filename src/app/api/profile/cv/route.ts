import { NextRequest, NextResponse } from "next/server";
import { saveCv, saveProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("cv");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "CV must be under 8MB" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = await saveCv(file.name || "cv.pdf", bytes);
  await saveProfile({ cv_filename: filename });
  return NextResponse.json({ ok: true, cv_filename: filename });
}
