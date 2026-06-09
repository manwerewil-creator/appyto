import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchProfile, saveProfile } from "@/lib/data";
import type { ResourceFile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cvs"; // reuse the existing private bucket; resources live under <uid>/resources/

// Upload an extra application document (certificate, reference, transcript, …).
export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "File must be under 8MB" }, { status: 400 });
  }

  const safeName = (file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
  // Prefix with a short time-based token so same-named files don't overwrite.
  const stamp = Date.now().toString(36);
  const path = `${user.id}/resources/${stamp}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin().storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const profile = await fetchProfile(sb, user.id);
  const existing = (profile?.resource_files ?? []) as ResourceFile[];
  const next = [...existing, { name: safeName, path }];
  await saveProfile(sb, user.id, { resource_files: next });

  return NextResponse.json({ ok: true, file: { name: safeName, path } });
}

// Remove an extra document by storage path.
export async function DELETE(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
  }

  await supabaseAdmin().storage.from(BUCKET).remove([path]);

  const profile = await fetchProfile(sb, user.id);
  const existing = (profile?.resource_files ?? []) as ResourceFile[];
  const next = existing.filter((f) => f.path !== path);
  await saveProfile(sb, user.id, { resource_files: next });

  return NextResponse.json({ ok: true, resource_files: next });
}
