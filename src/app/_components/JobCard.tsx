"use client";

import type { Job } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Building2, Mail, Loader2, ExternalLink, Pencil } from "lucide-react";

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
    <Card className="flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base leading-snug">
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {job.title}
              </a>
            </CardTitle>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.company ?? "Company confidential"}</span>
            </div>
          </div>
          {typeof job.score === "number" && (
            <Badge variant="success" title={job.reasons?.join(" · ")} className="shrink-0">
              {job.score}% match
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {job.location && (
            <Badge variant="outline" className="gap-1 font-normal">
              <MapPin className="h-3 w-3" />
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
            <Badge variant="secondary" className="font-normal">
              {job.category}
            </Badge>
          )}
          {job.salary && (
            <Badge variant="outline" className="font-normal">
              {job.salary}
            </Badge>
          )}
          <Badge variant={job.source === "jobszimbabwe" ? "default" : "warning"} className="font-normal">
            {job.source === "jobszimbabwe" ? "Jobs Zimbabwe" : "ApplyNOW"}
          </Badge>
          {job.posted_at && (
            <span className="text-xs text-muted-foreground">{ago(job.posted_at)}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.description.slice(0, 220)}…
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {canApply ? (
            <>
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.apply_email}</span>
            </>
          ) : (
            <span>Apply via posting</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {job.url && (
            <Button asChild variant="outline" size="sm">
              <a href={job.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            </Button>
          )}
          {onCustomize && canApply && !job.applied && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCustomize(job)}
              title="Write a custom email"
            >
              <Pencil className="h-4 w-4" />
              Customize
            </Button>
          )}
          {onApply &&
            (job.applied ? (
              <Badge variant="success">Applied ✓</Badge>
            ) : (
              <Button
                size="sm"
                disabled={!canApply || applying}
                title={canApply ? "Send your application by email" : "No email on this posting"}
                onClick={() => onApply(job)}
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}
