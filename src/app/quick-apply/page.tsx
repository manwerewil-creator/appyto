"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ComposeModal, { type ComposeJob } from "../_components/ComposeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Check, ClipboardPaste, FileEdit, MailCheck, Zap, ArrowRight } from "lucide-react";

const STEPS = [
  { Icon: ClipboardPaste, title: "Paste the advert", body: "From WhatsApp, LinkedIn, a newspaper — anywhere you spotted it." },
  { Icon: FileEdit, title: "We draft a response", body: "A tailored application you can read and edit before it goes out." },
  { Icon: MailCheck, title: "Send from your inbox", body: "It's delivered from your own connected email and logged for you." },
];

export default function QuickApply() {
  const [f, setF] = useState({ title: "", company: "", apply_email: "", location: "", description: "" });
  const [composeJob, setComposeJob] = useState<ComposeJob | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  const draft = async () => {
    setError(null);
    if (!f.apply_email.trim()) { setError("Enter the employer's email address."); return; }
    setCreating(true);
    const r = await fetch("/api/custom-job", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await r.json();
    setCreating(false);
    if (d.ok) setComposeJob({ id: d.job.id, title: d.job.title, apply_email: d.job.apply_email });
    else setError(d.error ?? "Could not save this job.");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Intro banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-7"
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="relative z-10 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Send className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Apply to any job, from one place</h1>
            <p className="max-w-lg text-sm text-white/85">
              Found a job elsewhere? Paste it below — we&rsquo;ll draft a response you can edit and send it
              straight from your connected inbox.
            </p>
          </div>
        </div>
      </motion.div>

      {done && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" /> Application sent — it&rsquo;s logged under Applications.
          <a href="/applications" className="inline-flex items-center gap-1 underline underline-offset-2">
            View <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* ── The form ───────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardPaste className="h-5 w-5 text-primary" /> Paste a job
            </CardTitle>
            <CardDescription>
              Tell us the employer&rsquo;s email and what the job is. The more detail you paste, the better the draft.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Accounts Clerk" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Delta Corp" />
              </div>
            </div>

            {/* Required email — visually emphasised in a tinted well. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                <Label htmlFor="apply_email" className="flex items-center gap-1.5 text-primary">
                  <MailCheck className="h-3.5 w-3.5" /> Employer email <span className="text-rose-500">*</span>
                </Label>
                <Input id="apply_email" type="email" value={f.apply_email} onChange={(e) => set("apply_email", e.target.value)} placeholder="hr@company.co.zw" className="bg-white" />
              </div>
              <div className="space-y-1.5 p-3">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Harare" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Job details / the advert text <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="description" rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Paste the job description or the email you received…" />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button onClick={draft} disabled={creating} size="lg" className="shadow-sm">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</> : <><Send className="h-4 w-4" /> Draft my response</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-50">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-semibold">How it works</h3>
              <ol className="space-y-4">
                {STEPS.map(({ Icon, title, body }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                    </span>
                    <div className="space-y-0.5 pt-0.5">
                      <p className="text-sm font-semibold leading-tight">{title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                <Zap className="h-3.5 w-3.5 shrink-0" /> A tool to apply faster, not a guarantee of a job.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {composeJob && (
        <ComposeModal
          job={composeJob}
          onClose={() => setComposeJob(null)}
          onSent={() => { setComposeJob(null); setDone(true); setF({ title: "", company: "", apply_email: "", location: "", description: "" }); }}
        />
      )}
    </div>
  );
}
