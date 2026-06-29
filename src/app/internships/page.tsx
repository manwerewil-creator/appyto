"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2, MapPin, Clock, Users, CalendarDays, Search, Crown, ArrowRight, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Opp {
  id: string; company_id: string; title: string; description: string | null;
  location: string | null; field: string | null; positions: number | null;
  duration: string | null; deadline: string | null; status: string; created_at: string;
  company_name?: string | null;
}

export default function InternshipsBrowse() {
  const [opps, setOpps] = useState<Opp[] | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [paid, setPaid] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [field, setField] = useState("");

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      try {
        const p = await fetch("/api/profile").then((r) => r.json());
        setPaid(!!PLANS[(p?.plan_id as PlanId) ?? "free"]?.isPaid);
      } catch { setPaid(false); }

      const { data } = await sb.from("vb_opportunities").select("*")
        .eq("status", "open").order("created_at", { ascending: false });
      const rows = (data ?? []) as Opp[];
      if (rows.length) {
        const ids = Array.from(new Set(rows.map((o) => o.company_id)));
        const { data: profs } = await sb.from("vb_profiles").select("id,company_name").in("id", ids);
        const nameMap: Record<string, string | null> = {};
        (profs ?? []).forEach((p: { id: string; company_name: string | null }) => { nameMap[p.id] = p.company_name; });
        rows.forEach((o) => { o.company_name = nameMap[o.company_id] ?? null; });
      }
      setOpps(rows);

      if (user) {
        const { data: apps } = await sb.from("vb_applications").select("opportunity_id").eq("student_id", user.id);
        setApplied(new Set((apps ?? []).map((a: { opportunity_id: string }) => a.opportunity_id)));
      }
    })();
  }, []);

  const fields = useMemo(
    () => Array.from(new Set((opps ?? []).map((o) => o.field).filter(Boolean))) as string[],
    [opps],
  );
  const filtered = (opps ?? []).filter((o) => {
    const s = q.toLowerCase();
    const matchQ = !s || o.title.toLowerCase().includes(s) || (o.field ?? "").toLowerCase().includes(s) || (o.location ?? "").toLowerCase().includes(s);
    return matchQ && (!field || o.field === field);
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Internships &amp; attachments</h1>
        <p className="text-sm text-muted-foreground">Apply with your Feasters profile and CV — no separate account.</p>
      </div>

      {paid === false && (
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Crown className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold">Internship applications are part of a paid plan</p>
                <p className="text-sm text-muted-foreground">Browse freely — upgrade to apply with one click.</p>
              </div>
            </div>
            <Button asChild className="shrink-0"><Link href="/billing"><Sparkles className="h-4 w-4" /> Upgrade</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, field or location…" className="pl-9" />
        </div>
        <select
          value={field} onChange={(e) => setField(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-56"
        >
          <option value="">All fields</option>
          {fields.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {opps === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <Search className="h-7 w-7 text-muted-foreground" />
          <p className="font-semibold">No open internships found</p>
          <p className="text-sm text-muted-foreground">Try a different search or check back soon.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const has = applied.has(o.id);
            return (
              <Card key={o.id} className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><Building2 className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-snug">{o.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{o.company_name || "—"}</p>
                      </div>
                    </div>
                    {has && <Badge variant="success">Applied</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {o.field && <Badge variant="secondary">{o.field}</Badge>}
                    {o.location && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{o.location}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {o.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{o.duration}</span>}
                    {o.positions != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{o.positions} position{o.positions !== 1 ? "s" : ""}</span>}
                    {o.deadline && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{o.deadline}</span>}
                  </div>
                  <Button asChild variant={has ? "outline" : "default"} className={cn("mt-auto w-full")}>
                    <Link href={`/internships/${o.id}`}>{has ? "View details" : "View & apply"} <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
