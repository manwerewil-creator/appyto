"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { jobLogo } from "@/lib/logo";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, Loader2, Heart, X, Briefcase, FileText } from "lucide-react";

export interface JobBoardCardProps {
  job: Job & { score?: number; applied?: boolean };
  index?: number;
  onApply?: (job: Job) => void;
  onPass?: (job: Job) => void;
  applying?: boolean;
}

// Deterministic, vivid logo colour for the monogram fallback.
const LOGO_COLORS = [
  "bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-rose-600",
  "bg-amber-600", "bg-indigo-600", "bg-teal-600", "bg-fuchsia-600",
];
function monogram(name: string | null) {
  const n = (name || "Job").trim();
  const initials = n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "J";
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { initials, color: LOGO_COLORS[h % LOGO_COLORS.length] };
}

function postedLabel(iso: string | null): string {
  if (!iso) return "Recently posted";
  const d = Date.now() - new Date(iso).getTime();
  const day = Math.floor(d / 86400000);
  if (day <= 0) return "Posted today";
  if (day === 1) return "Posted yesterday";
  if (day < 30) return `Posted ${day} days ago`;
  return `Posted ${Math.floor(day / 30)}mo ago`;
}

export default function JobBoardCard({ job, onApply, onPass, applying }: JobBoardCardProps) {
  const [passed, setPassed] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const { initials, color } = monogram(job.company);
  const logo = imgOk ? jobLogo(job) : null;

  // Pills: job type, then up to 3 tags / category — a clean, branded chip row.
  const pills = [
    job.job_type,
    job.category,
    ...(job.tags ?? []),
  ].filter(Boolean).slice(0, 4) as string[];

  const canApply = !!job.apply_email;

  const handlePass = () => { setPassed(true); onPass?.(job); };

  if (passed) return null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl ${logo ? "bg-white ring-1 ring-border" : color} text-lg font-bold text-white shadow-sm`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={40} height={40} className="h-9 w-9 object-contain"
                onError={() => setImgOk(false)} />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold leading-tight tracking-tight line-clamp-2">{job.title}</h3>
            <p className="mt-0.5 truncate text-sm font-medium text-primary">{job.company ?? "Confidential company"}</p>
          </div>

          {job.salary && (
            <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
              {job.salary}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</span>
          )}
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {postedLabel(job.posted_at)}</span>
        </div>

        {/* Pills */}
        {pills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pills.map((p, i) => (
              <span key={`${p}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/80">
                {i === 0 && <Briefcase className="h-3.5 w-3.5" />}
                {p}
              </span>
            ))}
          </div>
        )}

        {/* About this role */}
        {job.description && (
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" /> About this role
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {job.description.slice(0, 320)}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3">
        {job.applied ? (
          <span className="text-sm font-semibold text-emerald-700">Applied ✓</span>
        ) : (
          <Button variant="outline" onClick={handlePass} className="flex-1 sm:flex-none">
            <X className="h-4 w-4" /> Pass
          </Button>
        )}
        {!job.applied && (
          <Button
            variant="success"
            size="lg"
            className="flex-1 font-semibold shadow-sm sm:flex-none sm:min-w-[160px]"
            disabled={!canApply || applying}
            title={canApply ? "Apply with your profile & CV" : "No application email on this posting yet"}
            onClick={() => onApply?.(job)}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Heart className="h-4 w-4" /> Apply Now</>}
          </Button>
        )}
      </div>
    </div>
  );
}
