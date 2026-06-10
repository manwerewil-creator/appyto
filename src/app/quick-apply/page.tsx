"use client";

import { useState } from "react";
import ComposeModal, { type ComposeJob } from "../_components/ComposeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Check } from "lucide-react";

export default function QuickApply() {
  const [f, setF] = useState({ title: "", company: "", apply_email: "", location: "", description: "" });
  const [composeJob, setComposeJob] = useState<ComposeJob | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      <div>
        <p className="text-sm text-muted-foreground">Found a job elsewhere? Paste it and apply in one place.</p>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-4">
        {done && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
            <Check className="h-4 w-4" /> Application sent — it&rsquo;s logged under Applications.
            <a href="/applications" className="underline underline-offset-2">View</a>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Paste a job</CardTitle>
            <CardDescription>
              Paste a job you found (on WhatsApp, LinkedIn, a newspaper, anywhere). Tell us the employer&rsquo;s email and
              what the job is — we&rsquo;ll draft a response you can edit, then send it from your connected inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="apply_email">Employer email *</Label>
                <Input id="apply_email" value={f.apply_email} onChange={(e) => set("apply_email", e.target.value)} placeholder="hr@company.co.zw" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Harare" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Job details / the advert text (optional)</Label>
              <Textarea id="description" rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Paste the job description or the email you received…" />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={draft} disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</> : <><Send className="h-4 w-4" /> Draft my response</>}
              </Button>
            </div>
          </CardContent>
        </Card>
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
