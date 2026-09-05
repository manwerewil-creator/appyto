"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import type { ComposeJob } from "./ComposeModal";

export interface Quota {
  planId: string;
  autoSend: boolean;
}

// One place for the "apply to a job" behaviour shared by the job board, matches
// and internships:
//   • respects the user's send preference — auto-send vs review/customise first
//     (which opens the ComposeModal).
export function useApplyFlow() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [composeJob, setComposeJob] = useState<ComposeJob | null>(null);

  const reloadQuota = useCallback(() => {
    fetch("/api/quota").then((r) => r.json()).then(setQuota).catch(() => {});
  }, []);
  useEffect(() => { reloadQuota(); }, [reloadQuota]);

  const markApplied = useCallback((id: string) => {
    setAppliedIds((s) => new Set(s).add(id));
  }, []);

  const apply = useCallback(async (job: Job) => {
    // Review mode (default, and the safe fallback while quota is still loading):
    // open the composer so the user can preview / edit before it sends.
    if (!quota?.autoSend) {
      setComposeJob({ id: job.id, title: job.title, apply_email: job.apply_email });
      return;
    }

    // Automatic mode: send straight away.
    setApplyingId(job.id);
    try {
      const r = await fetch("/api/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const d = await r.json();
      if (d.ok) {
        markApplied(job.id);
        toast.success("Application sent", { description: job.title });
        reloadQuota();
      } else {
        toast.error("Could not apply", { description: d.reason ?? "Please try again." });
      }
    } catch {
      toast.error("Could not apply", { description: "Please try again." });
    } finally {
      setApplyingId(null);
    }
  }, [quota, markApplied, reloadQuota]);

  // Flip the send preference (auto vs review) and persist it to the profile.
  const setAutoSend = useCallback(async (v: boolean) => {
    setQuota((q) => (q ? { ...q, autoSend: v } : q));
    try {
      await fetch("/api/profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_send: v }),
      });
    } catch { /* best-effort; UI already reflects the choice */ }
  }, []);

  const onComposeSent = useCallback(() => {
    if (composeJob) {
      markApplied(composeJob.id);
      toast.success("Application sent", { description: composeJob.title });
    }
    setComposeJob(null);
    reloadQuota();
  }, [composeJob, markApplied, reloadQuota]);

  return {
    quota,
    applyingId,
    appliedIds,
    composeJob,
    setComposeJob,
    apply,
    onComposeSent,
    markApplied,
    reloadQuota,
    setAutoSend,
  };
}
