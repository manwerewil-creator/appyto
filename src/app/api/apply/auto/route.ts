import { NextRequest, NextResponse } from "next/server";
import { autoApply } from "@/lib/apply";
import { getSettings } from "@/lib/db";
import { emailReady } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (!emailReady(settings)) {
    return NextResponse.json({ ok: false, error: "Connect your email in Settings first." }, { status: 400 });
  }
  let max: number | undefined;
  try { max = (await req.json())?.max; } catch { /* no body */ }
  const result = await autoApply(typeof max === "number" ? max : undefined);
  return NextResponse.json({ ok: true, ...result });
}
