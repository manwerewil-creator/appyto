"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAID_PLANS, PlanId } from "@/lib/plans";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setCurrentPlan(p?.plan_id ?? "free"))
      .catch(() => setCurrentPlan("free"));
  }, []);

  const upgrade = async (plan_id: PlanId) => {
    setBusy(plan_id);
    setError(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id }),
      });
      const d = await r.json();
      if (d.ok && d.redirectUrl) {
        window.location.href = d.redirectUrl;
        return;
      }
      setError(d.error || "Could not start checkout. Try again.");
    } catch {
      setError("Could not start checkout. Try again.");
    }
    setBusy(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upgrade</h1>
        <p className="text-sm text-muted-foreground">Pick a plan that matches how hard you're job-hunting.</p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Free and Free+ stay free forever — Free+ even auto-applies 5/day with your own key.
        Paid plans simply raise your daily auto-apply cap. No refunds on partial months, cancel anytime.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PAID_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isFeatured = plan.id === "pro";
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isFeatured && "ring-2 ring-primary shadow-md",
              )}
            >
              {isFeatured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    {isFeatured && <Crown className="h-4 w-4 text-primary" />}
                    {plan.name}
                  </CardTitle>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <div className="pt-2">
                  <span className="text-4xl font-bold tracking-tight">${plan.priceUsd}</span>
                  <span className="text-sm text-muted-foreground"> /month</span>
                </div>
                <CardDescription>{plan.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isFeatured && !isCurrent ? "default" : "outline"}
                  disabled={busy !== null || isCurrent}
                  onClick={() => upgrade(plan.id)}
                >
                  {busy === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Your plan"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are handled by Paynow (EcoCash, OneMoney, Visa/Mastercard). You'll be redirected to pay securely,
        then brought back here once it's confirmed.
      </p>
    </div>
  );
}
