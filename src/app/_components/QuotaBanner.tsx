"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quota } from "./useApplyFlow";

// Shows free-tier usage ("3 of 5 free applications left") and an upgrade nudge.
// Renders nothing for paid / unlimited plans (limit === null).
export default function QuotaBanner({ quota }: { quota: Quota | null }) {
  if (!quota || quota.limit == null) return null;
  const { remaining, limit, blocked } = quota;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        blocked ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Crown className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {blocked ? "You've used all your free applications" : `${remaining} of ${limit} free applications left`}
          </p>
          <p className="text-xs text-muted-foreground">
            {blocked ? "Upgrade to a plan to keep applying." : "Upgrade any time for higher daily limits."}
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href="/billing"><Sparkles className="h-4 w-4" /> Upgrade</Link>
      </Button>
    </div>
  );
}
