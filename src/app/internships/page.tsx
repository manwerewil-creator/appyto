"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, Sparkles, Check, ChevronLeft, ChevronRight } from "lucide-react";
import JobBoardCard from "../_components/JobBoardCard";
import ComposeModal from "../_components/ComposeModal";
import { useApplyFlow } from "../_components/useApplyFlow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassSearch } from "@/components/ui/glass-search";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, canAccessInternships, INTERNSHIP_PLANS } from "@/lib/plans";
import type { Job } from "@/lib/types";

// Internships & attachments are a slice of the same scraped job catalogue,
// filtered to early-career roles and gated to the higher plans. The board itself
// is the standard job board (apply by email with the user's profile & CV).
export default function InternshipsPage() {
  const { quota, applyingId, appliedIds, composeJob, setComposeJob, apply, onComposeSent } = useApplyFlow();
  const [items, setItems] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [passed, setPassed] = useState<Set<string>>(new Set());

  const allowed = quota != null && canAccessInternships(quota.planId);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const qs = new URLSearchParams({ internships: "1", search, page: String(p), pageSize: "25" });
    try {
      const r = await fetch(`/api/jobs?${qs}`);
      const d = await r.json();
      if (!r.ok) { setItems([]); setFiltered(0); return; }
      setItems(Array.isArray(d.items) ? d.items : []);
      setFiltered(d.filtered ?? 0);
      setPage(d.page ?? p);
    } catch {
      setItems([]); setFiltered(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!allowed) return;
    const t = setTimeout(() => load(1), 250);
    return () => clearTimeout(t);
  }, [load, allowed]);

  const pages = Math.ceil(filtered / 25);

  const passOne = (job: Job) => setPassed((s) => new Set(s).add(job.id));
  const visible = items.filter((j) => !passed.has(j.id));

  // ── Loading the plan ────────────────────────────────────────────────────────
  if (quota === null) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Locked: not on a plan that includes internships ─────────────────────────
  if (!allowed) {
    const planNames = INTERNSHIP_PLANS.map((id) => PLANS[id].name).join(" & ");
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Internships &amp; attachments</h1>
          <p className="text-sm text-muted-foreground">
            Hand-picked internship, attachment &amp; graduate-trainee roles — apply with one tap.
          </p>
        </div>

        <Card className="overflow-hidden border-primary/30">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-8 w-8" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">A {planNames} feature</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                The Internships section gathers every internship, industrial attachment and
                graduate-trainee opening into one place. Upgrade to unlock it.
              </p>
            </div>
            <ul className="mx-auto grid max-w-sm gap-2 text-left text-sm">
              {[
                "Every internship & attachment, filtered for you",
                "Apply with your saved profile & CV in one tap",
                "Higher daily auto-apply limits across the board",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-1">
              <Link href="/billing"><Sparkles className="h-4 w-4" /> See plans &amp; upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Unlocked: the internship-filtered job board ─────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:grid">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Internships &amp; attachments</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Finding internship roles…" : `${filtered.toLocaleString()} internship & attachment roles open right now.`}
          </p>
        </div>
      </div>

      <GlassSearch
        containerClassName="w-full"
        placeholder="Search internships by title, skill or company"
        value={search}
        onChange={setSearch}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
          No internships match your search right now — check back soon, new roles land throughout the day.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((j, i) => (
              <JobBoardCard
                key={j.id}
                job={{ ...j, applied: appliedIds.has(j.id) }}
                index={i}
                onApply={apply}
                onPass={passOne}
                applying={applyingId === j.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages.toLocaleString()}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {composeJob && (
        <ComposeModal job={composeJob} onClose={() => setComposeJob(null)} onSent={onComposeSent} />
      )}
    </div>
  );
}
