"use client";

import { useEffect, useState } from "react";

export interface ComposeJob { id: string; title: string; apply_email: string | null; }

// A custom-email composer. Prefills the code-generated draft, but the user can
// rewrite it completely before sending — their words, their call.
export default function ComposeModal({
  job, onClose, onSent,
}: {
  job: ComposeJob;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/draft?job_id=${encodeURIComponent(job.id)}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setSubject(d.subject); setBody(d.body); } setLoading(false); })
      .catch(() => setLoading(false));
  }, [job.id]);

  const send = async () => {
    setSending(true); setError(null);
    const r = await fetch("/api/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id, custom_subject: subject, custom_body: body }),
    });
    const d = await r.json();
    setSending(false);
    if (d.ok) onSent(); else setError(d.reason ?? "Could not send.");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(640px,100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Write your email</h3>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Applying to <b>{job.title}</b></p>

        {loading ? <div className="empty">Preparing draft…</div> : (
          <div className="grid" style={{ gap: 12 }}>
            <div className="col"><label className="label">To</label>
              <input className="input" value={job.apply_email ?? ""} disabled /></div>
            <div className="col"><label className="label">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="col"><label className="label">Message (edit freely — this is exactly what gets sent)</label>
              <textarea className="textarea" rows={12} value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>Your CV is attached automatically if you’ve uploaded one.</p>
            {error && <div className="card" style={{ background: "var(--red-soft)", borderColor: "#f3c9c9", color: "var(--red)" }}>{error}</div>}
            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button className="btn ghost" onClick={onClose}>Cancel</button>
              <button className="btn green" onClick={send} disabled={sending || !job.apply_email}>{sending ? <span className="spinner" /> : "Send application"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
