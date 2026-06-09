import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { fetchJobs } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { sb, user } = await getAuth();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("search") ?? "").toLowerCase().trim();
  const category = sp.get("category") ?? "";
  const location = sp.get("location") ?? "";
  const type = sp.get("type") ?? "";
  const onlyEmail = sp.get("onlyEmail") === "1";
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 25)));

  let jobs = await fetchJobs(sb);
  const total = jobs.length;

  if (q) {
    jobs = jobs.filter((j) =>
      (j.title + " " + (j.company ?? "") + " " + (j.description ?? "")).toLowerCase().includes(q));
  }
  if (category) jobs = jobs.filter((j) => j.category === category);
  if (location) jobs = jobs.filter((j) => j.location === location);
  if (type) jobs = jobs.filter((j) => j.job_type === type);
  if (onlyEmail) jobs = jobs.filter((j) => !!j.apply_email);

  const filtered = jobs.length;
  const start = (page - 1) * pageSize;
  const items = jobs.slice(start, start + pageSize);

  return NextResponse.json({ total, filtered, page, pageSize, items });
}
