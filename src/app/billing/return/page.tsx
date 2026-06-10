"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PLANS, PlanId } from "@/lib/plans";

export default function BillingReturnPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("your new plan");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) {
      setDone(true);
      return;
    }

    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      tries += 1;
      try {
        const d = await (await fetch(`/api/billing/status?ref=${encodeURIComponent(ref)}`)).json();
        setStatus(d.status ?? null);
        if (d.status === "paid") {
          try {
            const p = await (await fetch("/api/profile")).json();
            const id = p?.plan_id as PlanId | undefined;
            if (id && PLANS[id]) setPlanName(PLANS[id].name);
          } catch {
            /* keep generic name */
          }
          setDone(true);
          return;
        }
      } catch {
        /* ignore and retry */
      }
      if (tries >= 6) {
        setDone(true);
        return;
      }
      timer = setTimeout(poll, 2500);
    };

    poll();
    return () => clearTimeout(timer);
  }, []);

  const paid = status === "paid";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <Card className="w-full text-center">
        {paid ? (
          <>
            <CardHeader className="items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40">
                <Check className="h-7 w-7" />
              </div>
              <CardTitle>Payment confirmed</CardTitle>
              <CardDescription>You're on {planName}! Your daily auto-apply cap has been raised.</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">
                  Back to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </>
        ) : done ? (
          <>
            <CardHeader className="items-center space-y-3">
              <CardTitle>Awaiting confirmation…</CardTitle>
              <CardDescription>
                We haven't confirmed this payment yet. If you completed it, your plan will update
                automatically within a few minutes — no need to pay again.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild variant="ghost">
                <Link href="/">Back to dashboard</Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Confirming your payment…</p>
              <p className="text-sm text-muted-foreground">This only takes a moment…</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
