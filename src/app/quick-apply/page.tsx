"use client";

import { useState } from "react";
import PageHeader from "../_components/PageHeader";
import ComposeModal, { type ComposeJob } from "../_components/ComposeModal";

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
    <>
      <PageHeader title="Quick Apply" subtitle="Found a job elsewhere? Paste it and apply in one place." />
      <div className="content" style={{ maxWidth: 720 }}>
        {done && (
          <div className="card" style={{ background: "var(--green-soft)", borderColor: "#cdebd6", color: "var(--green)", marginBottom: 16 }}>
            Application sent ✓ It’s logged under Applications. <a href="/applications" style={{ textDecoration: "underline" }}>View</a>
          </div>
        )}
        <div className="card grid" style={{ gap: 14 }}>
          <p className="muted" style={{ margin: 0 }}>
            Paste a job you found (on WhatsApp, LinkedIn, a newspaper, anywhere). Tell us the employer’s email and
            what the job is — we’ll draft a response you can edit, then send it from your connected inbox.
          </p>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="col"><label className="label">Job title</label><input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Accounts Clerk" /></div>
            <div className="col"><label className="label">Company</label><input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Delta Corp" /></div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="col"><label className="label">Employer email *</label><input className="input" value={f.apply_email} onChange={(e) => set("apply_email", e.target.value)} placeholder="hr@company.co.zw" /></div>
            <div className="col"><label className="label">Location</label><input className="input" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Harare" /></div>
          </div>
          <div className="col"><label className="label">Job details / the advert text (optional)</label>
            <textarea className="textarea" rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Paste the job description or the email you received…" /></div>
          {error && <div className="card" style={{ background: "var(--red-soft)", borderColor: "#f3c9c9", color: "var(--red)" }}>{error}</div>}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={draft} disabled={creating}>{creating ? <span className="spinner" /> : "Draft my response →"}</button>
          </div>
        </div>
      </div>

      {composeJob && (
        <ComposeModal
          job={composeJob}
          onClose={() => setComposeJob(null)}
          onSent={() => { setComposeJob(null); setDone(true); setF({ title: "", company: "", apply_email: "", location: "", description: "" }); }}
        />
      )}
    </>
  );
}
