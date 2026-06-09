import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { autoApply } from "@/lib/apply";
import { fetchCreds } from "@/lib/data";
import { emailReady } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await fetchCreds(sb, user.id);
  if (!emailReady(creds)) {
    return NextResponse.json({ ok: false, error: "Connect your email in Settings first." }, { status: 400 });
  }

  let max: number | undefined;
  try { max = (await req.json())?.max; } catch { /* no body */ }
  const r = await autoApply(sb, user.id, typeof max === "number" ? max : undefined);
  return NextResponse.json({ ok: true, ...r });
}
