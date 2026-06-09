"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "../_components/PageHeader";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const [data, setData] = useState<{ items: Application[]; sent: number; failed: number; today: number } | null>(null);

  useEffect(() => { fetch("/api/applications").then((r) => r.json()).then(setData).catch(() => {}); }, []);

  const when = (iso: string | null) => iso ? new Date(iso).toLocaleString() : "—";

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle={data ? `${data.sent} sent · ${data.today} today · ${data.failed} failed` : ""}
      />
      <div className="content">
        {!data ? (
          <div className="empty">Loading…</div>
        ) : data.items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 36 }}>
            <h3>No applications yet</h3>
            <p className="muted">Head to your matches and apply — every send is logged here.</p>
            <Link className="btn" href="/matches">Go to matches →</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", background: "var(--bg-soft)", color: "var(--muted)" }}>
                  <th style={{ padding: "11px 14px" }}>Job</th>
                  <th style={{ padding: "11px 14px" }}>Sent to</th>
                  <th style={{ padding: "11px 14px" }}>Status</th>
                  <th style={{ padding: "11px 14px" }}>When</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{a.job_title}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{a.company ?? ""}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }} className="muted">{a.to_email ?? "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                      {a.error && <div className="muted" style={{ fontSize: 11.5, maxWidth: 240 }}>{a.error}</div>}
                    </td>
                    <td style={{ padding: "11px 14px" }} className="muted">{when(a.sent_at ?? a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
