"use client";

import type { Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, BadgeCheck, Loader2, Mail } from "lucide-react";

export interface JobBoardCardProps {
  job: Job & { score?: number; applied?: boolean };
  index?: number;                 // drives the rotating tint, like the reference design
  onApply?: (job: Job) => void;
  applying?: boolean;
}

// Rotating soft backgrounds so the list reads as colourful rows (matches the
// reference board). Kept subtle so text stays readable on the light theme.
const TINTS = [
  "bg-white",
  "bg-amber-50/80",
  "bg-sky-50/80",
  "bg-emerald-50/70",
  "bg-violet-50/70",
  "bg-rose-50/70",
];

// Deterministic, vivid logo colour from the company name.
const LOGO_COLORS = [
  "bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-rose-600",
  "bg-amber-600", "bg-indigo-600", "bg-teal-600", "bg-fuchsia-600",
];
function logoFor(name: string | null) {
  const n = (name || "Job").trim();
  const initials = n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "J";
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { initials, color: LOGO_COLORS[h % LOGO_COLORS.length] };
}

function ago(iso: string | null): string {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d`;
  return `${Math.floor(day / 30)}mo`;
}

function isNew(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 36 * 3600000; // < ~1.5 days
}

export default function JobBoardCard({ job, index = 0, onApply, applying }: JobBoardCardProps) {
  const { initials, color } = logoFor(job.company);
  const tint = TINTS[index % TINTS.length];
  const tags = (job.tags ?? []).filter(Boolean).slice(0, 4);
  const canApply = job.apply_method === "email" && !!job.apply_email;

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-2xl border border-border/70 ${tint} p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-5`}
    >
      {/* Logo */}
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${color} text-lg font-bold text-white shadow-sm`}>
        {initials}
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[15px] font-semibold leading-tight hover:underline"
          >
            {job.title}
          </a>
          {isNew(job.posted_at) && (
            <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
          {typeof job.score === "number" && (
            <span title="Match score">
              <BadgeCheck className="h-4 w-4 text-primary" />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">{job.company ?? "Company confidential"}</span>
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full border border-border bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right rail: category + salary + meta */}
      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        {job.category && (
          <Badge className="bg-foreground text-background hover:bg-foreground/90 uppercase tracking-wide">
            {job.category}
          </Badge>
        )}
        {job.salary ? (
          <span className="text-sm font-bold text-emerald-700">{job.salary}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Salary not stated</span>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          {job.posted_at && <span className="text-xs text-muted-foreground">{ago(job.posted_at)}</span>}
          {onApply ? (
            job.applied ? (
              <Badge variant="success">Applied ✓</Badge>
            ) : (
              <Button size="sm" disabled={!canApply || applying}
                title={canApply ? "Send your application by email" : "No email on this posting"}
                onClick={() => onApply(job)}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : canApply ? <><Mail className="h-4 w-4" /> Apply</> : "View"}
              </Button>
            )
          ) : (
            <Button asChild size="sm" variant="outline">
              <a href={job.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> View
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
