"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Building2, Target, Mail, Send, CheckCircle2, Circle, ArrowRight, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityFeed from "./_components/ActivityFeed";

interface Stats {
  totalJobs: number; openJobs: number; companies: number; withEmail: number;
  matches: number; applicationsSent: number; appliedToday: number; dailyCap: number;
  emailReady: boolean; profileReady: boolean; cvReady: boolean;
}

const fmt = (n: number) => n.toLocaleString();

export default function Overview() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setS).catch(() => {}); }, []);

  const stats = s ? [
    { label: "Open jobs", value: fmt(s.openJobs), Icon: Briefcase, tint: "text-blue-600 bg-blue-50" },
    { label: "Companies hiring", value: fmt(s.companies), Icon: Building2, tint: "text-violet-600 bg-violet-50" },
    { label: "Match your profile", value: fmt(s.matches), Icon: Target, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Apply by email", value: fmt(s.withEmail), Icon: Mail, tint: "text-amber-600 bg-amber-50" },
    { label: "Applied today", value: `${s.appliedToday}/${s.dailyCap}`, Icon: Send, tint: "text-rose-600 bg-rose-50" },
  ] : [];

  const checklist = s ? [
    { done: s.profileReady, label: "Tell us what jobs you want", href: "/onboarding" },
    { done: s.cvReady, label: "Upload your CV", href: "/profile" },
    { done: s.emailReady, label: "Connect your email", href: "/settings" },
  ] : [];
  const setupDone = checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your job-application command centre</p>
      </div>

      {!s && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {s && s.totalJobs === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-semibold">No jobs loaded yet</h2>
          <p className="text-sm text-muted-foreground">Run the scraper (GitHub Actions) to fill your database.</p>
        </CardContent></Card>
      )}

      {s && s.totalJobs > 0 && (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map(({ label, value, Icon, tint }) => (
              <Card key={label} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tabular-nums leading-tight">{value}</div>
                    <div className="truncate text-xs text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Setup checklist */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Setup ({setupDone}/3)</h3>
                  {setupDone === 3 && <Badge variant="success">Ready to apply</Badge>}
                </div>
                <div className="divide-y">
                  {checklist.map((c) => (
                    <Link key={c.label} href={c.href} className="flex items-center justify-between py-3 text-sm hover:opacity-80">
                      <span className="flex items-center gap-2.5">
                        {c.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        {c.label}
                      </span>
                      <span className="text-muted-foreground">{c.done ? "Done" : "Set up →"}</span>
                    </Link>
                  ))}
                </div>
                <Button asChild className="mt-4"><Link href="/matches">View my {fmt(s.matches)} matches <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="bg-gradient-to-br from-primary/5 to-violet-50">
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">How Featers works</h3>
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Scrapers pull every job from Jobs Zimbabwe + ApplyNOW.</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Pure code (no AI) ranks them against your profile.</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Featers emails your CV to employers from your own inbox.</li>
                </ol>
                <p className="mt-4 text-xs text-muted-foreground">A tool to apply faster — not a guarantee of a job.</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ActivityFeed />
    </div>
  );
}
