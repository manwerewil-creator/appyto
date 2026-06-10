"use client";

import type { Job } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Loader2, Pencil, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (day === 1) return "1 day ago";
  if (day < 30) return `${day} days ago`;
  const mo = Math.floor(day / 30);
  return mo === 1 ? "1 month ago" : `${mo} months ago`;
}

// Job type → solid pill colour, matching the reference tiles.
function typeStyle(t?: string | null) {
  const k = (t ?? "").toLowerCase();
  if (k.includes("full")) return "bg-teal-500";
  if (k.includes("part")) return "bg-blue-500";
  if (k.includes("intern")) return "bg-rose-500";
  if (k.includes("contract")) return "bg-violet-500";
  if (k.includes("temp")) return "bg-amber-500";
  return "bg-slate-500";
}

export default function JobCard({ job, onApply, onCustomize, applying }: JobCardProps) {
  const canApply = job.apply_method === "email" && !!job.apply_email;

  return (
    <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:flex-row">
      {/* ── Main content ── */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug tracking-tight">{job.title}</h3>
          {typeof job.score === "number" && (
            <Badge variant="success" title={job.reasons?.join(" · ")} className="shrink-0">
              {job.score}% match
            </Badge>
          )}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {job.company ?? "Company confidential"}
        </p>
        {job.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {job.description.slice(0, 240)}…
          </p>
        )}
      </div>

      {/* ── Vertical divider ── */}
      <div className="hidden w-px self-stretch bg-border sm:block" />

      {/* ── Right meta column ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:w-48">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-amber-500 ring-1 ring-amber-300/70">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="truncate">{job.location || "Anywhere"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-amber-500 ring-1 ring-amber-300/70">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="truncate">{job.posted_at ? `Posted ${ago(job.posted_at)}` : "Recently posted"}</span>
        </div>

        {job.job_type && (
          <span className={cn(
            "inline-flex w-fit items-center rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white",
            typeStyle(job.job_type),
          )}>
            {job.job_type}
          </span>
        )}

        {/* Actions — apply / customize, or the applied state */}
        {onApply && (
          <div className="mt-0.5 flex items-center gap-2">
            {job.applied ? (
              <Badge variant="success" className="gap-1 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied
              </Badge>
            ) : (
              <>
                <Button
                  size="sm"
                  disabled={!canApply || applying}
                  onClick={() => onApply(job)}
                  title={canApply ? "Send your application by email" : "No email on this posting"}
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
                {onCustomize && canApply && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Write a custom email" onClick={() => onCustomize(job)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
