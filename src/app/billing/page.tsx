"use client";

import { useEffect, useState } from "react";
import { Check, Crown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAID_PLANS, PlanId, PLANS } from "@/lib/plans";
import PaymentModal, { type CheckoutPlan } from "./PaymentModal";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutPlan | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setCurrentPlan(p?.plan_id ?? "free"))
      .catch(() => setCurrentPlan("free"));
  }, []);

  // Open the in-app checkout (mobile money / card) — no Paynow login page.
  const upgrade = (plan_id: PlanId) => {
    const p = PLANS[plan_id];
    setCheckout({ id: plan_id, name: p.name, priceUsd: p.priceUsd });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Intro */}
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Pick your plan</h1>
        <p className="text-sm text-muted-foreground">
          Free stays free forever. Paid plans simply raise your daily auto-apply cap. Cancel anytime.
        </p>
      </div>

      {/* Tiles */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PAID_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isFeatured = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition-shadow",
                isFeatured
                  ? "border-primary/40 shadow-lg ring-1 ring-primary/30 lg:-mt-3 lg:mb-3"
                  : "border-border/70 shadow-sm hover:shadow-md",
              )}
            >
              {isFeatured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  Most popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isFeatured && <Crown className="h-5 w-5 text-amber-500" />}
                  <span className="text-lg font-bold">{plan.name}</span>
                </div>
                {isCurrent && <Badge variant="success">Current</Badge>}
              </div>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold tracking-tight">${plan.priceUsd}</span>
                <span className="pb-1 text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>

              <div className="my-5 h-px bg-border" />

              <ul className="flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                      isFeatured ? "bg-primary/15 text-primary" : "bg-emerald-100 text-emerald-600")}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={isFeatured && !isCurrent ? "default" : "outline"}
                disabled={isCurrent}
                onClick={() => upgrade(plan.id)}
              >
                {isCurrent ? "Your plan" : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Trust line — no provider names */}
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        Secure payment · Pay with EcoCash, OneMoney or card · Cancel anytime
      </p>

      {checkout && (
        <PaymentModal
          plan={checkout}
          onClose={() => setCheckout(null)}
          onSuccess={() => { setCurrentPlan(checkout.id); setCheckout(null); }}
        />
      )}
    </div>
  );
}
