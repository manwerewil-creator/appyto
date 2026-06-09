"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "./_components/PageHeader";

interface Stats {
  totalJobs: number; openJobs: number; companies: number; withEmail: number;
  matches: number; applicationsSent: number; appliedToday: number; dailyCap: number;
  emailReady: boolean; profileReady: boolean; cvReady: boolean;
}

export default function Overview() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setS).catch(() => {}); }, []);

  const Stat = ({ n, l }: { n: React.ReactNode; l: string }) => (
    <div className="card stat"><span className="num">{n}</span><span className="lbl">{l}</span></div>
  );

  const Check = ({ done, label, href }: { done: boolean; label: string; href: string }) => (
    <Link href={href} className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="row" style={{ gap: 10 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center",
          background: done ? "var(--green-soft)" : "var(--bg-soft)", color: done ? "var(--green)" : "var(--muted)",
          border: `1px solid ${done ? "#cdebd6" : "var(--border)"}`, fontSize: 13,
        }}>{done ? "✓" : "○"}</span>
        {label}
      </span>
      <span className="muted">{done ? "Done" : "Set up →"}</span>
    </Link>
  );

  const setupDone = s ? [s.profileReady, s.cvReady, s.emailReady].filter(Boolean).length : 0;

  return (
    <>
      <PageHeader title="Overview" subtitle="Your job-application command centre" />
      <div className="content">
        {!s ? (
          <div className="empty">Loading…</div>
        ) : s.totalJobs === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <h2>No jobs loaded yet</h2>
            <p className="muted">Run the scraper to fill your database:</p>
            <pre style={{ background: "var(--bg-soft)", padding: 14, borderRadius: 10, display: "inline-block" }}>
              npm run scrape
            </pre>
          </div>
        ) : (
          <div className="grid" style={{ gap: 22 }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
              <Stat n={s.openJobs.toLocaleString()} l="Open jobs" />
              <Stat n={s.companies.toLocaleString()} l="Companies hiring" />
              <Stat n={<span style={{ color: "var(--brand)" }}>{s.matches.toLocaleString()}</span>} l="Match your profile" />
              <Stat n={s.withEmail.toLocaleString()} l="Apply-by-email" />
              <Stat n={`${s.appliedToday}/${s.dailyCap}`} l="Applied today" />
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 22, alignItems: "start" }}>
              <div className="card">
                <div className="spread" style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Setup ({setupDone}/3)</h3>
                  {setupDone === 3 && <span className="badge sent">Ready to apply</span>}
                </div>
                <Check done={s.profileReady} label="Tell us what jobs you want" href="/onboarding" />
                <Check done={s.cvReady} label="Upload your CV" href="/profile" />
                <Check done={s.emailReady} label="Connect your email (Gmail/SMTP)" href="/settings" />
                <div style={{ marginTop: 16 }} className="row">
                  <Link className="btn" href="/matches">View my {s.matches.toLocaleString()} matches →</Link>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>How Appyto works</h3>
                <ol className="muted" style={{ paddingLeft: 18, lineHeight: 1.9, margin: 0 }}>
                  <li>Scrapers pull every job from Jobs Zimbabwe + ApplyNOW.</li>
                  <li>Pure code (no AI) ranks them against your profile.</li>
                  <li>Appyto emails your CV to employers — from your own inbox.</li>
                </ol>
                <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>
                  A tool to apply faster — not a guarantee of a job.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
