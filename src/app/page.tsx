"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Briefcase, Building2, Target, Mail, CheckCircle2, Circle, ArrowRight, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/use-user";
import ActivityFeed from "./_components/ActivityFeed";

interface Stats {
  totalJobs: number; openJobs: number; companies: number; withEmail: number;
  matches: number; applicationsSent: number; appliedToday: number; dailyCap: number;
  emailReady: boolean; profileReady: boolean; cvReady: boolean;
}

const fmt = (n: number) => n.toLocaleString();

// Smooth count-up for stat numbers. Respects reduced-motion (renders instantly).
function Counter({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <>{fmt(n)}</>;
}

export default function Overview() {
  const [s, setS] = useState<Stats | null>(null);
  const { name } = useUser();
  const reduce = useReducedMotion();

  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setS).catch(() => {}); }, []);

  const firstName = (name ?? "").trim().split(/\s+/)[0];

  // Entrance: gentle stagger + fade/slide. transform/opacity only (no layout thrash).
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.04 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  };

  const stats = s ? [
    { label: "Open jobs", value: s.openJobs, Icon: Briefcase, tint: "text-blue-600 bg-blue-50" },
    { label: "Companies hiring", value: s.companies, Icon: Building2, tint: "text-violet-600 bg-violet-50" },
    { label: "Match your profile", value: s.matches, Icon: Target, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Apply by email", value: s.withEmail, Icon: Mail, tint: "text-amber-600 bg-amber-50" },
  ] : [];

  const checklist = s ? [
    { done: s.profileReady, label: "Tell us what jobs you want", href: "/onboarding" },
    { done: s.cvReady, label: "Upload your CV", href: "/profile" },
    { done: s.emailReady, label: "Connect your email", href: "/settings" },
  ] : [];
  const setupDone = checklist.filter((c) => c.done).length;

  const todayPct = s && s.dailyCap > 0 ? Math.min(100, Math.round((s.appliedToday / s.dailyCap) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8"
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />

        {/* Job image on the right, fading out toward the left into the card. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/job-bsk.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover object-center md:block"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, #000 55%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 55%)",
          }}
        />

        <div className="relative z-10 max-w-xl space-y-5">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-white/80">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Your job-search command centre</h1>
            <p className="max-w-md text-sm text-white/80">
              {s ? `${fmt(s.matches)} jobs match your profile right now.` : "Loading your latest matches…"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="bg-white font-semibold text-primary shadow-md hover:bg-white/90">
              <Link href="/matches">
                <Sparkles className="h-4 w-4" /> View my matches <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {s && (
              <div className="w-full sm:max-w-[14rem]">
                <div className="flex justify-between text-xs text-white/80">
                  <span>Applied today</span>
                  <span className="tabular-nums">{s.appliedToday}/{s.dailyCap}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${todayPct}%` }}
                    transition={{ duration: reduce ? 0 : 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {!s && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {s && s.totalJobs === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-semibold">No jobs loaded yet</h2>
          <p className="text-sm text-muted-foreground">Jobs will appear here as soon as the catalogue is populated.</p>
        </CardContent></Card>
      )}

      {s && s.totalJobs > 0 && (
        <>
          {/* ── Stat cards (staggered) ───────────────────────────────────── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map(({ label, value, Icon, tint }) => (
              <motion.div
                key={label}
                variants={item}
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold tabular-nums leading-tight">
                        <Counter value={value} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6"
          >
            {/* Setup checklist */}
            <motion.div variants={item}>
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Get set up</h3>
                    {setupDone === 3
                      ? <Badge variant="success">Ready to apply</Badge>
                      : <span className="text-sm tabular-nums text-muted-foreground">{setupDone}/3</span>}
                  </div>
                  {/* progress */}
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(setupDone / 3) * 100}%` }}
                      transition={{ duration: reduce ? 0 : 0.7, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <div className="divide-y">
                    {checklist.map((c) => (
                      <Link key={c.label} href={c.href}
                        className="group flex items-center justify-between py-3 text-sm transition-colors hover:text-primary">
                        <span className="flex items-center gap-2.5">
                          {c.done
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <Circle className="h-5 w-5 text-muted-foreground" />}
                          {c.label}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {c.done ? "Done" : "Set up"}
                          {!c.done && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Button asChild className="mt-4 w-full sm:w-auto">
                    <Link href="/matches">View my {fmt(s.matches)} matches <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}

      <ActivityFeed />
    </div>
  );
}
