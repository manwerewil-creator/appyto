"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

// A friendly "this is a paid feature" screen used to gate the CV builder, job
// matching, and the attachments section. Always points to /billing.
export default function UpgradeGate({
  title, description, bullets, cta = "See plans",
}: {
  title: string;
  description: string;
  bullets?: string[];
  cta?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/billing"><Sparkles className="h-4 w-4" /> {cta}</Link>
        </Button>
      </div>
    </div>
  );
}
