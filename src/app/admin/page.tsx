"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users, Crown, DollarSign, Repeat, Send, Eye, RefreshCw, Radio, TrendingUp,
  Activity as ActivityIcon, CreditCard, UserPlus, BarChart3, AlertTriangle, type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types mirror /api/admin/overview ─────────────────────────────────────────
interface Overview {
  generatedAt: string;
  analyticsReady: boolean;
  users: { total: number; paid: number; free: number; newToday: number; new7d: number; new30d: number; byPlan: Record<string, number> };
  revenue: { totalUsd: number; last30Usd: number; todayUsd: number; mrrUsd: number; paidCount: number };
  applications: { total: number; sent: number; today: number; last7d: number };
  traffic: { views30: number; visitors30: number; views7d: number; visitors7d: number; viewsToday: number; visitorsToday: number; loggedInViews: number; live: number };
  series: { date: string; views: number; visitors: number; signups: number }[];
  topPaths: { path: string; views: number }[];
  recentPayments: { email: string | null; name: string | null; plan: string; amount: number; status: string; at: string }[];
  recentSignups: { email: string | null; name: string | null; plan: string; at: string | null }[];
  recentActivity: { type: string; summary: string | null; at: string; email: string | null; name: string | null }[];
}

const PLAN_NAMES: Record<string, string> = { free: "Free", free_plus: "Free+", base: "Base", pro: "Pro", premium: "Premium" };
const PLAN_TINTS: Record<string, string> = {
  free: "bg-slate-400", free_plus: "bg-sky-400", base: "bg-emerald-500", pro: "bg-violet-500", premium: "bg-amber-500",
};

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
const initials = (name: string | null, email: string | null) =>
  (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase();

function Kpi({ Icon, label, value, sub, tint }: { Icon: LucideIcon; label: string; value: string; sub?: string; tint: string }) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg", tint)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <div className="text-xl font-bold tabular-nums leading-tight sm:text-2xl">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
          {sub && <div className="mt-0.5 text-[11px] font-medium text-emerald-600">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Panel({ title, Icon, children, action }: { title: string; Icon: LucideIcon; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [d, setD] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 403 ? "Not authorised." : `Error ${r.status}`);
      setD(await r.json());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // live-ish refresh
    return () => clearInterval(t);
  }, [load]);

  const maxViews = d ? Math.max(1, ...d.series.map((s) => s.views)) : 1;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Control centre</h2>
          <p className="text-sm text-muted-foreground">
            {d ? `Updated ${timeAgo(d.generatedAt)}` : "Live payments, traffic & activity"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d && (
            <Badge variant="secondary" className="gap-1.5">
              <Radio className={cn("h-3 w-3", d.traffic.live > 0 ? "text-emerald-500" : "text-muted-foreground")} />
              {fmt(d.traffic.live)} online now
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {err && (
        <Card><CardContent className="flex items-center gap-2 p-4 text-sm text-rose-600">
          <AlertTriangle className="h-4 w-4" /> {err}
        </CardContent></Card>
      )}

      {!d && !err && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {d && (
        <>
          {!d.analyticsReady && (
            <Card><CardContent className="flex items-start gap-2 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span className="text-muted-foreground">
                Visitor analytics aren&apos;t live yet — run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/003_analytics_events.sql</code>{" "}
                in the Supabase SQL editor to start collecting traffic.
              </span>
            </CardContent></Card>
          )}

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi Icon={Users} label="Total users" value={fmt(d.users.total)} tint="bg-blue-50 text-blue-600"
              sub={d.users.newToday > 0 ? `+${d.users.newToday} today` : undefined} />
            <Kpi Icon={Crown} label="Paid users" value={fmt(d.users.paid)} tint="bg-violet-50 text-violet-600"
              sub={d.users.total > 0 ? `${Math.round((d.users.paid / d.users.total) * 100)}% conversion` : undefined} />
            <Kpi Icon={Repeat} label="MRR" value={money(d.revenue.mrrUsd)} tint="bg-emerald-50 text-emerald-600" />
            <Kpi Icon={DollarSign} label="Revenue (all-time)" value={money(d.revenue.totalUsd)} tint="bg-amber-50 text-amber-600"
              sub={d.revenue.todayUsd > 0 ? `+${money(d.revenue.todayUsd)} today` : undefined} />
            <Kpi Icon={Send} label="Applications sent" value={fmt(d.applications.sent)} tint="bg-rose-50 text-rose-600"
              sub={d.applications.today > 0 ? `+${d.applications.today} today` : undefined} />
            <Kpi Icon={Eye} label="Visitors (30d)" value={fmt(d.traffic.visitors30)} tint="bg-sky-50 text-sky-600"
              sub={`${fmt(d.traffic.views30)} views`} />
          </div>

          {/* Traffic chart */}
          <Panel title="Traffic — last 14 days" Icon={TrendingUp}
            action={<span className="text-xs text-muted-foreground">{fmt(d.traffic.visitorsToday)} visitors · {fmt(d.traffic.viewsToday)} views today</span>}>
            <div className="flex h-40 items-end gap-1.5">
              {d.series.map((s) => (
                <div key={s.date} className="group flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="relative flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[26px] rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                      style={{ height: `${Math.max(2, (s.views / maxViews) * 100)}%` }}
                    />
                    {/* tooltip */}
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background group-hover:block">
                      {s.views} views · {s.visitors} visitors{s.signups ? ` · ${s.signups} signups` : ""}
                    </div>
                  </div>
                  <span className="text-[9px] tabular-nums text-muted-foreground">{s.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Plan mix + Top pages */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Plan distribution" Icon={BarChart3}>
              <div className="space-y-3">
                {["free", "free_plus", "base", "pro", "premium"].map((id) => {
                  const n = d.users.byPlan[id] ?? 0;
                  const pct = d.users.total > 0 ? Math.round((n / d.users.total) * 100) : 0;
                  return (
                    <div key={id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{PLAN_NAMES[id] ?? id}</span>
                        <span className="tabular-nums text-muted-foreground">{fmt(n)} · {pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", PLAN_TINTS[id])} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Top pages (30d)" Icon={Eye}>
              {d.topPaths.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No traffic recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {d.topPaths.map((p) => {
                    const max = Math.max(1, ...d.topPaths.map((x) => x.views));
                    return (
                      <div key={p.path} className="flex items-center gap-3">
                        <code className="w-32 shrink-0 truncate text-xs text-muted-foreground sm:w-44">{p.path}</code>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-sky-400" style={{ width: `${(p.views / max) * 100}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{fmt(p.views)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          {/* Recent payments */}
          <Panel title="Recent payments" Icon={CreditCard}
            action={<span className="text-xs text-muted-foreground">{fmt(d.revenue.paidCount)} paid · {money(d.revenue.last30Usd)} in 30d</span>}>
            {d.recentPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[440px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 font-medium">User</th>
                      <th className="px-2 py-2 font-medium">Plan</th>
                      <th className="px-2 py-2 text-right font-medium">Amount</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 text-right font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {d.recentPayments.map((p, i) => (
                      <tr key={i}>
                        <td className="max-w-[180px] truncate px-2 py-2.5">{p.email ?? "—"}</td>
                        <td className="px-2 py-2.5">{PLAN_NAMES[p.plan] ?? p.plan}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{money(p.amount)}</td>
                        <td className="px-2 py-2.5">
                          <Badge variant={p.status === "paid" ? "success" : "secondary"} className="capitalize">{p.status}</Badge>
                        </td>
                        <td className="px-2 py-2.5 text-right text-xs text-muted-foreground">{timeAgo(p.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Signups + Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Newest users" Icon={UserPlus}
              action={<span className="text-xs text-muted-foreground">+{fmt(d.users.new7d)} this week</span>}>
              {d.recentSignups.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
              ) : (
                <div className="divide-y">
                  {d.recentSignups.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(u.name, u.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.name ?? u.email ?? "Anonymous"}</p>
                        {u.name && u.email && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
                      </div>
                      <Badge variant="secondary" className="shrink-0">{PLAN_NAMES[u.plan] ?? u.plan}</Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(u.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Who's doing what" Icon={ActivityIcon}>
              {d.recentActivity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="divide-y">
                  {d.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{a.summary ?? a.type}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.email ?? "—"}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
