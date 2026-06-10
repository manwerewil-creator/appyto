"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Building2, Mail, Clock, Inbox, ArrowRight, CheckCircle2, XCircle, Send, Hourglass, MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/lib/types";

// Per-status visual language: a left rail, a tinted icon chip and a label colour.
const STATUS: Record<ApplicationStatus, { rail: string; chip: string; label: string; Icon: typeof Send }> = {
  sent:    { rail: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-600", label: "text-emerald-700",  Icon: CheckCircle2 },
  failed:  { rail: "bg-rose-400",    chip: "bg-rose-50 text-rose-600",       label: "text-rose-700",     Icon: XCircle },
  queued:  { rail: "bg-blue-400",    chip: "bg-blue-50 text-blue-600",       label: "text-blue-700",     Icon: Hourglass },
  skipped: { rail: "bg-slate-300",   chip: "bg-slate-100 text-slate-500",    label: "text-slate-600",    Icon: MinusCircle },
};

function initials(name?: string | null) {
  if (!name) return null;
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || name[0].toUpperCase();
}

export default function ApplicationsPage() {
  const [data, setData] = useState<{ items: Application[]; sent: number; failed: number; today: number } | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => { fetch("/api/applications").then((r) => r.json()).then(setData).catch(() => {}); }, []);

  const when = (iso: string | null) => iso ? new Date(iso).toLocaleString() : "—";

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  };

  const summary = data ? [
    { label: "Sent", value: data.sent, Icon: Send, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Today", value: data.today, Icon: Clock, tint: "text-blue-600 bg-blue-50" },
    { label: "Failed", value: data.failed, Icon: XCircle, tint: "text-rose-600 bg-rose-50" },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">Every application you send is logged here.</p>

      {/* Summary stat cards */}
      {data && data.items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {summary.map(({ label, value, Icon, tint }) => (
            <Card key={label} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tint)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <Card className="text-center">
          <CardHeader className="items-center space-y-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Inbox className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>No applications yet</CardTitle>
            <CardDescription>Head to your matches and apply — every send is logged here.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/matches">Go to matches <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {data.items.map((a) => {
            const s = STATUS[a.status] ?? STATUS.skipped;
            const mono = initials(a.company);
            return (
              <motion.div key={a.id} variants={item}>
                <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  {/* Status colour rail */}
                  <div className={cn("absolute inset-y-0 left-0 w-1", s.rail)} />
                  <CardContent className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold", s.chip)}>
                        {mono ?? <Building2 className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-semibold leading-snug">{a.job_title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {a.company && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{a.company}</span>
                            </span>
                          )}
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{a.to_email ?? "—"}</span>
                          </span>
                        </div>
                        {a.error && <p className="max-w-md text-xs text-rose-600">{a.error}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize", s.chip, s.label)}>
                        <s.Icon className="h-3.5 w-3.5" />
                        {a.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {when(a.sent_at ?? a.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
