"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "../_components/PageHeader";
import JobCard from "../_components/JobCard";
import ComposeModal, { type ComposeJob } from "../_components/ComposeModal";
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
    <>
      <PageHeader
        title="My Matches"
        subtitle={data ? `${data.count.toLocaleString()} jobs match your profile` : "Scoring jobs…"}
        right={
          <button className="btn green" onClick={runAuto} disabled={auto.running || !data?.applyable}>
            {auto.running ? <span className="spinner" /> : "⚡"} Auto-apply to {data?.applyable ?? 0}
          </button>
        }
      />
      <div className="content">
        {auto.msg && <div className="card" style={{ marginBottom: 14, background: "var(--green-soft)", borderColor: "#cdebd6" }}>{auto.msg}</div>}

        {!data ? (
          <div className="empty">Scoring jobs against your profile…</div>
        ) : !data.hasPrefs ? (
          <div className="card" style={{ textAlign: "center", padding: 36 }}>
            <h3>Tell us what you’re looking for</h3>
            <p className="muted">Add your desired roles, categories and locations so we can match jobs for you.</p>
            <Link className="btn" href="/profile">Set up my profile →</Link>
          </div>
        ) : data.items.length === 0 ? (
          <div className="empty">No matches yet. Try broadening your preferences in <Link href="/profile">Profile</Link>.</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {data.items.map((j) => (
              <JobCard key={j.id} job={j} onApply={applyOne}
                onCustomize={(job) => setComposeJob({ id: job.id, title: job.title, apply_email: job.apply_email })}
                applying={applyingId === j.id} />
            ))}
          </div>
        )}
      </div>

      {composeJob && (
        <ComposeModal job={composeJob} onClose={() => setComposeJob(null)}
          onSent={() => { setComposeJob(null); load(); }} />
      )}
    </>
  );
}
