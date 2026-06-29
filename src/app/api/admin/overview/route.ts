import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANS, PlanId, PAID_PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Aggregated analytics + business metrics for the admin dashboard. Reads across
// ALL users via the service role (bypasses RLS) — hence the strict admin gate.
// Volumes are small for a young app, so we fetch bounded windows and aggregate
// in JS rather than maintaining SQL rollups.

interface ProfileLite { email: string | null; full_name: string | null; plan_id: string | null; created_at: string | null; }
interface PaymentLite { amount_usd: number | string; status: string; plan_id: string; created_at: string; }
interface EventLite { created_at: string; visitor_id: string | null; user_id: string | null; path: string | null; }
// PostgREST returns an embedded to-one relation as an object (older versions: array).
type Embedded<T> = T | T[] | null;
const one = <T,>(v: Embedded<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v ?? null);

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayISO = startOfToday.toISOString();
  const d7 = new Date(now - 7 * 864e5).toISOString();
  const d30 = new Date(now - 30 * 864e5).toISOString();
  const d5m = new Date(now - 5 * 60_000).toISOString();
  const paidIds = new Set<string>(PAID_PLANS.map((p) => p.id));
  const day = (iso: string) => iso.slice(0, 10);

  // ── Fire all reads in parallel ─────────────────────────────────────────────
  const [
    usersCountRes, profilesRes,
    paidPaymentsRes, recentPaymentsRes,
    appsTotalRes, appsSentRes, appsTodayRes, apps7dRes,
    eventsRes, activityRes,
  ] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("email,full_name,plan_id,created_at").order("created_at", { ascending: false }).limit(5000),
    sb.from("payments").select("amount_usd,status,plan_id,created_at").eq("status", "paid").limit(5000),
    sb.from("payments").select("amount_usd,status,plan_id,created_at,profiles(email,full_name)").order("created_at", { ascending: false }).limit(10),
    sb.from("applications").select("*", { count: "exact", head: true }),
    sb.from("applications").select("*", { count: "exact", head: true }).eq("status", "sent"),
    sb.from("applications").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    sb.from("applications").select("*", { count: "exact", head: true }).gte("created_at", d7),
    sb.from("analytics_events").select("created_at,visitor_id,user_id,path").gte("created_at", d30).order("created_at", { ascending: false }).limit(20000),
    sb.from("activity_events").select("type,summary,created_at,profiles(email,full_name)").order("created_at", { ascending: false }).limit(14),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const profiles = (profilesRes.data ?? []) as ProfileLite[];
  const usersTotal = usersCountRes.count ?? profiles.length;
  const byPlan: Record<string, number> = {};
  for (const p of profiles) {
    const id = p.plan_id ?? "free";
    byPlan[id] = (byPlan[id] ?? 0) + 1;
  }
  const paidUsers = profiles.filter((p) => paidIds.has(p.plan_id ?? "")).length;
  const newToday = profiles.filter((p) => p.created_at && p.created_at >= todayISO).length;
  const new7d = profiles.filter((p) => p.created_at && p.created_at >= d7).length;
  const new30d = profiles.filter((p) => p.created_at && p.created_at >= d30).length;
  const recentSignups = profiles.slice(0, 8).map((p) => ({
    email: p.email, name: p.full_name, plan: p.plan_id ?? "free", at: p.created_at,
  }));

  // ── Revenue ────────────────────────────────────────────────────────────────
  const paidPayments = (paidPaymentsRes.data ?? []) as PaymentLite[];
  const sum = (rows: PaymentLite[]) => rows.reduce((s, r) => s + Number(r.amount_usd || 0), 0);
  const revenueTotal = sum(paidPayments);
  const revenue30 = sum(paidPayments.filter((p) => p.created_at >= d30));
  const revenueToday = sum(paidPayments.filter((p) => p.created_at >= todayISO));
  // MRR = recurring monthly value of currently-active paid plans.
  const mrr = Object.entries(byPlan).reduce((s, [id, n]) => {
    const plan = PLANS[id as PlanId];
    return s + (plan?.isPaid ? plan.priceUsd * n : 0);
  }, 0);
  const recentPayments = ((recentPaymentsRes.data ?? []) as unknown as (PaymentLite & { profiles: Embedded<{ email: string | null; full_name: string | null }> })[])
    .map((p) => {
      const prof = one(p.profiles);
      return {
        email: prof?.email ?? null, name: prof?.full_name ?? null,
        plan: p.plan_id, amount: Number(p.amount_usd || 0), status: p.status, at: p.created_at,
      };
    });

  // ── Applications ─────────────────────────────────────────────────────────--
  const applications = {
    total: appsTotalRes.count ?? 0,
    sent: appsSentRes.count ?? 0,
    today: appsTodayRes.count ?? 0,
    last7d: apps7dRes.count ?? 0,
  };

  // ── Traffic (degrades gracefully if the table isn't migrated yet) ──────────
  const analyticsReady = !eventsRes.error;
  const events = (eventsRes.data ?? []) as EventLite[];
  const uniq = (rows: EventLite[]) => new Set(rows.map((e) => e.visitor_id).filter(Boolean)).size;
  const todayEvents = events.filter((e) => e.created_at >= todayISO);
  const events7d = events.filter((e) => e.created_at >= d7);
  const traffic = {
    views30: events.length,
    visitors30: uniq(events),
    views7d: events7d.length,
    visitors7d: uniq(events7d),
    viewsToday: todayEvents.length,
    visitorsToday: uniq(todayEvents),
    loggedInViews: events.filter((e) => e.user_id).length,
    live: new Set(events.filter((e) => e.created_at >= d5m).map((e) => e.visitor_id).filter(Boolean)).size,
  };

  // 14-day series: views, unique visitors, signups per day.
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(day(new Date(now - i * 864e5).toISOString()));
  const series = days.map((d) => {
    const de = events.filter((e) => day(e.created_at) === d);
    return {
      date: d,
      views: de.length,
      visitors: new Set(de.map((e) => e.visitor_id).filter(Boolean)).size,
      signups: profiles.filter((p) => p.created_at && day(p.created_at) === d).length,
    };
  });

  // Top pages (last 30 days).
  const pathCounts: Record<string, number> = {};
  for (const e of events) if (e.path) pathCounts[e.path] = (pathCounts[e.path] ?? 0) + 1;
  const topPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  // ── Recent activity ("who's doing what") ───────────────────────────────────
  const recentActivity = ((activityRes.data ?? []) as unknown as { type: string; summary: string | null; created_at: string; profiles: Embedded<{ email: string | null; full_name: string | null }> }[])
    .map((a) => {
      const prof = one(a.profiles);
      return { type: a.type, summary: a.summary, at: a.created_at, email: prof?.email ?? null, name: prof?.full_name ?? null };
    });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    analyticsReady,
    users: { total: usersTotal, paid: paidUsers, free: usersTotal - paidUsers, newToday, new7d, new30d, byPlan },
    revenue: { totalUsd: revenueTotal, last30Usd: revenue30, todayUsd: revenueToday, mrrUsd: mrr, paidCount: paidPayments.length },
    applications,
    traffic,
    series,
    topPaths,
    recentPayments,
    recentSignups,
    recentActivity,
  });
}
