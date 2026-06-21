"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, Smartphone, CreditCard, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Method = "ecocash" | "onemoney" | "innbucks";
type Step = "form" | "pending" | "success";

const METHODS: { id: Method; label: string; network: string; ring: string }[] = [
  { id: "ecocash", label: "EcoCash", network: "Econet", ring: "data-[on=true]:border-blue-500 data-[on=true]:bg-blue-50" },
  { id: "onemoney", label: "OneMoney", network: "NetOne", ring: "data-[on=true]:border-emerald-500 data-[on=true]:bg-emerald-50" },
  { id: "innbucks", label: "InnBucks", network: "InnBucks", ring: "data-[on=true]:border-violet-500 data-[on=true]:bg-violet-50" },
];

// Light client-side normalise so we can validate before hitting the server.
function normalize(p: string): string {
  let d = (p || "").replace(/\D/g, "");
  if (d.startsWith("263")) d = "0" + d.slice(3);
  else if (d.length === 9 && d.startsWith("7")) d = "0" + d;
  return d;
}

export interface CheckoutPlan { id: string; name: string; priceUsd: number; }

export default function PaymentModal({
  plan, onClose, onSuccess,
}: {
  plan: CheckoutPlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<Method>("ecocash");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const triesRef = useRef(0);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const phoneOk = /^07\d{8}$/.test(normalize(phone));

  const startPoll = (reference: string) => {
    triesRef.current = 0;
    pollRef.current = setInterval(async () => {
      triesRef.current += 1;
      try {
        const d = await (await fetch(`/api/billing/status?ref=${encodeURIComponent(reference)}`)).json();
        if (d.status === "paid") {
          clearInterval(pollRef.current);
          setStep("success");
          return;
        }
      } catch { /* keep polling */ }
      if (triesRef.current >= 40) {          // ~3 min at 4.5s
        clearInterval(pollRef.current);
        setError("We haven't seen the payment yet. If you approved it, your plan updates automatically — you can close this.");
      }
    }, 4500);
  };

  const payMobile = async () => {
    if (!phoneOk) { setError("Enter a valid mobile number, e.g. 0771234567."); return; }
    setError(null); setBusy(true);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, phone: normalize(phone), method }),
      });
      const d = await r.json();
      if (d.ok && d.mode === "mobile") {
        setInstructions(d.instructions || "Approve the payment prompt on your phone to complete.");
        setStep("pending");
        startPoll(d.reference);
      } else {
        setError(d.error || "Could not start the payment. Please try again.");
      }
    } catch {
      setError("Could not start the payment. Check your connection and try again.");
    }
    setBusy(false);
  };

  const payCard = async () => {
    setError(null); setBusy(true);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const d = await r.json();
      if (d.ok && d.redirectUrl) { window.location.href = d.redirectUrl; return; }
      setError(d.error || "Could not start the payment. Please try again.");
    } catch {
      setError("Could not start the payment. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Upgrade</p>
            <p className="font-bold">{plan.name} · <span className="text-primary">${plan.priceUsd}</span><span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {step === "form" && (
            <>
              <div className="space-y-2">
                <Label>Pay with mobile money</Label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      data-on={method === m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "rounded-xl border-2 border-border bg-background px-2 py-2.5 text-center transition-colors",
                        m.ring,
                      )}
                    >
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{m.network}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile number</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0771234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">You&rsquo;ll get a prompt on this number to approve the payment.</p>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}

              <Button className="w-full" size="lg" disabled={busy || !phoneOk} onClick={payMobile}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay $${plan.priceUsd}`}
              </Button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" disabled={busy} onClick={payCard}>
                <CreditCard className="h-4 w-4" /> Pay with card / ZimSwitch
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secured payment · Cancel anytime
              </p>
            </>
          )}

          {step === "pending" && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Check your phone</p>
                <p className="text-sm text-muted-foreground">{instructions}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for approval…
              </div>
              {error && <p className="text-xs text-amber-600">{error}</p>}
              <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-7 w-7" strokeWidth={3} />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Payment confirmed</p>
                <p className="text-sm text-muted-foreground">You&rsquo;re on {plan.name}. Your daily auto-apply cap is raised.</p>
              </div>
              <Button className="w-full" onClick={onSuccess}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
