"use client";

import type { Job } from "@/lib/types";
import styles from "./JobCard.module.css";

export interface JobCardProps {
  job: Job & { score?: number; reasons?: string[]; applied?: boolean };
  onApply?: (job: Job) => void;
  onCustomize?: (job: Job) => void;
  applying?: boolean;
}

function ago(iso: string | null): string {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  const day = Math.floor(d / 86400000);
  if (day <= 0) return "today";
  if (day === 1) return "yesterday";
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

export default function JobCard({ job, onApply, onCustomize, applying }: JobCardProps) {
  const canApply = job.apply_method === "email" && !!job.apply_email;
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.head}>
        <div style={{ minWidth: 0 }}>
          <a href={job.url} target="_blank" rel="noreferrer" className={styles.title}>
            {job.title}
          </a>
          <div className={styles.company}>
            {job.company ?? "Company confidential"}
          </div>
        </div>
        {typeof job.score === "number" && (
          <span className={styles.score} title={job.reasons?.join(" · ")}>
            {job.score}% match
          </span>
        )}
      </div>

      <div className={styles.meta}>
        {job.location && <span className="tag">📍 {job.location}</span>}
        {job.job_type && <span className="tag">{job.job_type}</span>}
        {job.category && <span className="tag">{job.category}</span>}
        {job.salary && <span className="tag">💰 {job.salary}</span>}
        <span className={`tag ${job.source === "jobszimbabwe" ? styles.srcA : styles.srcB}`}>
          {job.source === "jobszimbabwe" ? "Jobs Zimbabwe" : "ApplyNOW"}
        </span>
        {job.posted_at && <span className={styles.date}>{ago(job.posted_at)}</span>}
      </div>

      {job.description && (
        <p className={styles.desc}>{job.description.slice(0, 220)}…</p>
      )}

      <div className={styles.foot}>
        <div className="muted" style={{ fontSize: 13 }}>
          {canApply ? <>✉ {job.apply_email}</> : <span>Apply via posting</span>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {job.url && <a className="btn ghost sm" href={job.url} target="_blank" rel="noreferrer">View</a>}
          {onCustomize && canApply && !job.applied && (
            <button className="btn ghost sm" onClick={() => onCustomize(job)} title="Write a custom email">✎ Customize</button>
          )}
          {onApply && (
            job.applied ? (
              <span className="badge sent">Applied ✓</span>
            ) : (
              <button
                className="btn sm"
                disabled={!canApply || applying}
                title={canApply ? "Send your application by email" : "No email on this posting"}
                onClick={() => onApply(job)}
              >
                {applying ? <span className="spinner" /> : "Apply"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
