"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import JobCard from "../_components/JobCard";
import ComposeModal, { type ComposeJob } from "../_components/ComposeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { Job } from "@/lib/types";

type Match = Job & { score: number; reasons: string[]; applied: boolean };

export default function MatchesPage() {
  const [data, setData] = useState<{ hasPrefs: boolean; count: number; applyable: number; items: Match[] } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [auto, setAuto] = useState<{ running: boolean; msg?: string }>({ running: false });
  const [composeJob, setComposeJob] = useState<ComposeJob | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/matches"); setData(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const applyOne = async (job: Job) => {
    setApplyingId(job.id);
    const r = await fetch("/api/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    });
    const d = await r.json();
    if (!d.ok) alert(d.reason ?? "Could not apply.");
    setApplyingId(null);
    load();
  };

  const runAuto = async () => {
    setAuto({ running: true, msg: "Sending applications…" });
    const r = await fetch("/api/apply/auto", { method: "POST" });
    const d = await r.json();
    if (!d.ok) { setAuto({ running: false }); alert(d.error ?? "Auto-apply failed."); return; }
    setAuto({ running: false, msg: `Sent ${d.sent}, skipped ${d.skipped}, failed ${d.failed}.` });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Matches</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.count.toLocaleString()} jobs match your profile` : "Scoring jobs…"}
          </p>
        </div>
        <Button variant="success" onClick={runAuto} disabled={auto.running || !data?.applyable}>
          {auto.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Auto-apply to {data?.applyable ?? 0}
        </Button>
      </div>

      {auto.msg && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
          <CardContent className="py-3 text-sm text-emerald-800 dark:text-emerald-200">{auto.msg}</CardContent>
        </Card>
      )}

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="py-12 text-center text-sm text-muted-foreground">Scoring…</CardContent></Card>
          ))}
        </div>
      ) : !data.hasPrefs ? (
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Tell us what you’re looking for</CardTitle>
            <CardDescription>
              Add your desired roles, categories and locations so we can match jobs for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/onboarding">Set up my profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No matches yet. Try broadening your preferences in{" "}
            <Link href="/onboarding" className="font-medium text-primary underline-offset-4 hover:underline">Profile</Link>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((j) => (
            <JobCard key={j.id} job={j} onApply={applyOne}
              onCustomize={(job) => setComposeJob({ id: job.id, title: job.title, apply_email: job.apply_email })}
              applying={applyingId === j.id} />
          ))}
        </div>
      )}

      {composeJob && (
        <ComposeModal job={composeJob} onClose={() => setComposeJob(null)}
          onSent={() => { setComposeJob(null); load(); }} />
      )}
    </div>
  );
}
