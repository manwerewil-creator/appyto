"use client";

import type { Job } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Mail, Loader2, Pencil, CheckCircle2, Clock } from "lucide-react";
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
  if (day === 1) return "yesterday";
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

// Score → visual tier. The top accent bar, the avatar tint and the score pill
// all read from this so a strong match is instantly legible at a glance.
function tier(score?: number) {
  if (typeof score !== "number") return null;
  if (score >= 70) return { bar: "from-emerald-400 to-green-500", pill: "from-emerald-500 to-green-600", ring: "bg-emerald-50 text-emerald-700" };
  if (score >= 45) return { bar: "from-blue-400 to-indigo-500", pill: "from-blue-500 to-indigo-600", ring: "bg-blue-50 text-blue-700" };
  return { bar: "from-amber-300 to-orange-400", pill: "from-amber-500 to-orange-500", ring: "bg-amber-50 text-amber-700" };
}

// Two-letter monogram for the company avatar.
function initials(name?: string | null) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name[0].toUpperCase();
}

export default function JobCard({ job, onApply, onCustomize, applying }: JobCardProps) {
  const canApply = job.apply_method === "email" && !!job.apply_email;
  const t = tier(job.score);

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
      )}
    >
      {/* Top accent bar, colored by match strength. */}
      {t && <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.bar)} />}

      <CardContent className="flex-1 space-y-3.5 p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                t?.ring ?? "bg-muted text-muted-foreground",
              )}
            >
              {initials(job.company)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
                {job.title}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {job.company ?? "Company confidential"}
              </p>
            </div>
          </div>

          {typeof job.score === "number" && t && (
            <div
              title={job.reasons?.join(" · ")}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-xl bg-gradient-to-br px-2.5 py-1.5 text-white shadow-sm",
                t.pill,
              )}
            >
              <span className="text-sm font-bold leading-none tabular-nums">{job.score}%</span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-90">match</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {job.location && (
            <Badge variant="outline" className="gap-1 border-border/70 font-normal text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/70" />
              {job.location}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Briefcase className="h-3 w-3" />
              {job.job_type}
            </Badge>
          )}
          {job.category && (
            <Badge variant="default" className="font-normal">
              {job.category}
            </Badge>
          )}
          {job.salary && (
            <Badge variant="success" className="font-medium">
              {job.salary}
            </Badge>
          )}
          {job.posted_at && (
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {ago(job.posted_at)}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {job.description.slice(0, 220)}…
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {canApply ? (
            <>
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{job.apply_email}</span>
            </>
          ) : (
            <span className="italic">Apply via posting</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onCustomize && canApply && !job.applied && (
            <Button variant="ghost" size="sm" onClick={() => onCustomize(job)} title="Write a custom email">
              <Pencil className="h-4 w-4" />
              Customize
            </Button>
          )}
          {onApply &&
            (job.applied ? (
              <Badge variant="success" className="gap-1 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied
              </Badge>
            ) : (
              <Button
                size="sm"
                disabled={!canApply || applying}
                title={canApply ? "Send your application by email" : "No email on this posting"}
                onClick={() => onApply(job)}
                className="shadow-sm"
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}
