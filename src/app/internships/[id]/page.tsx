"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Clock, Users, CalendarDays, Crown, Sparkles, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanId } from "@/lib/plans";

interface Opp {
  id: string; company_id: string; title: string; description: string | null;
  location: string | null; field: string | null; positions: number | null;
  duration: string | null; requirements: string | null; deadline: string | null;
  status: string; company_name?: string | null;
}

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      try {
        const p = await fetch("/api/profile").then((r) => r.json());
        setPaid(!!PLANS[(p?.plan_id as PlanId) ?? "free"]?.isPaid);
        setName(p?.full_name ?? null);
      } catch { setPaid(false); }

      const { data: o } = await sb.from("vb_opportunities").select("*").eq("id", id).single();
      if (o) {
        const { data: c } = await sb.from("vb_profiles").select("company_name").eq("id", (o as Opp).company_id).single();
        setOpp({ ...(o as Opp), company_name: (c as { company_name: string | null } | null)?.company_name ?? null });
        if (user) {
          const { data: app } = await sb.from("vb_applications").select("status")
            .eq("opportunity_id", id).eq("student_id", user.id).maybeSingle();
          if (app) setAppliedStatus((app as { status: string }).status);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const apply = async () => {
    if (!opp) return;
    setBusy(true); setError("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error: err } = await sb.from("vb_applications").insert({
      opportunity_id: opp.id,
      student_id: user.id,
      cover_note: note,
      cv_url: null,
      applicant_name: name,
      status: "pending",
    });
    if (err) {
      setError(err.code === "23505" ? "You've already applied for this internship." : err.message);
      setBusy(false);
      return;
    }
    try {
      await sb.from("vb_notifications").insert({
        user_id: opp.company_id, body: `New application for ${opp.title}`, link: "/company",
      });
    } catch { /* best-effort */ }
    setDone(true); setAppliedStatus("pending"); setBusy(false);
  };

  if (loading) {
    return <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  }
  if (!opp) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">Internship not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link href="/internships"><ArrowLeft className="h-4 w-4" /> All internships</Link></Button>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground"><Building2 className="h-6 w-6" /></span>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight">{opp.title}</h1>
              <p className="text-muted-foreground">{opp.company_name || "—"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {opp.field && <Badge variant="secondary">{opp.field}</Badge>}
            {opp.location && <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{opp.location}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:grid-cols-3">
            {opp.duration && <span className="inline-flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{opp.duration}</span>}
            {opp.positions != null && <span className="inline-flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{opp.positions} position{opp.positions !== 1 ? "s" : ""}</span>}
            {opp.deadline && <span className="inline-flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />{opp.deadline}</span>}
          </div>
          {opp.description && <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p><p className="whitespace-pre-line text-sm leading-relaxed">{opp.description}</p></div>}
          {opp.requirements && <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requirements</p><p className="whitespace-pre-line text-sm leading-relaxed">{opp.requirements}</p></div>}
        </CardContent>
      </Card>

      {/* Apply */}
      {appliedStatus ? (
        <Card><CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">Application submitted</span>
            <Badge variant="secondary" className="capitalize">{appliedStatus}</Badge>
          </div>
          {done && <span className="text-xs text-muted-foreground">The employer has been notified.</span>}
        </CardContent></Card>
      ) : paid === false ? (
        <Card className="border-primary/30 bg-primary/[0.03]"><CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Crown className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold">Upgrade to apply</p><p className="text-sm text-muted-foreground">Internship applications are part of a paid plan.</p></div>
          </div>
          <Button asChild className="shrink-0"><Link href="/billing"><Sparkles className="h-4 w-4" /> See plans</Link></Button>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-bold">Apply for this internship</h2>
          <p className="text-sm text-muted-foreground">Your Feasters profile and CV are shared with the employer.</p>
          <Textarea rows={5} placeholder="Add a short cover note — why you're a great fit…" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={apply} disabled={busy} className="w-full">{busy ? "Submitting…" : "Submit application"}</Button>
        </CardContent></Card>
      )}
    </div>
  );
}
