"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Eyebrow, Input, Spinner, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";

type Method = "ecocash" | "onemoney" | "card";

const METHODS: { key: Method; label: string; icon: "card" | "dollar"; mobile: boolean; placeholder?: string }[] = [
  { key: "ecocash", label: "EcoCash", icon: "card", mobile: true, placeholder: "EcoCash number e.g. 0771234567" },
  { key: "onemoney", label: "OneMoney", icon: "card", mobile: true, placeholder: "OneMoney number e.g. 0712345678" },
  { key: "card", label: "Card", icon: "dollar", mobile: false },
];

const FEATURES = [
  "Unlimited applications",
  "CV & document storage",
  "Direct recruiter messaging",
  "Real-time status tracking",
  "Application history",
  "Priority placement alerts",
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-white">
        <Icon name="spark2" className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[17px] font-extrabold tracking-tightest text-ink">VisionBridge</span>
    </Link>
  );
}

export default function PayPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [method, setMethod] = useState<Method>("ecocash");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [waiting, setWaiting] = useState(false);   // mobile prompt sent, polling
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("vb_profiles").select("paid").eq("id", data.user.id).single();
      if (profile?.paid) { router.push("/student"); return; }
      setChecking(false);
    })();
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [router]);

  function startPolling(reference: string) {
    let tries = 0;
    pollTimer.current = setInterval(async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/vb/pay/status?ref=${encodeURIComponent(reference)}`, { cache: "no-store" });
        const j = await r.json();
        if (j.status === "paid") {
          if (pollTimer.current) clearInterval(pollTimer.current);
          router.push("/student");
          return;
        }
      } catch { /* keep trying */ }
      if (tries >= 40) {                 // ~3 minutes
        if (pollTimer.current) clearInterval(pollTimer.current);
        setWaiting(false);
        setProcessing(false);
        setError("We haven't received your payment yet. If you approved it, give it a moment and refresh.");
      }
    }, 4500);
  }

  async function handlePay() {
    setError("");
    const m = METHODS.find((x) => x.key === method)!;
    if (m.mobile && !/^0?7\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setError("Enter a valid mobile number, e.g. 0771234567.");
      return;
    }
    setProcessing(true);
    try {
      const r = await fetch("/api/vb/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phone }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Payment could not be started."); setProcessing(false); return; }

      if (j.mode === "web" && j.redirectUrl) {
        window.location.href = j.redirectUrl;          // Paynow hosted page (card)
        return;
      }
      // mobile express checkout — prompt is on the phone now
      setWaiting(true);
      setInstructions(j.instructions || "Approve the payment prompt on your phone to complete.");
      startPolling(j.reference);
    } catch {
      setError("Network error. Please try again.");
      setProcessing(false);
    }
  }

  if (checking) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-paper"><Spinner /></div>;
  }

  const current = METHODS.find((m) => m.key === method)!;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-16">
      <div className="mb-10 flex flex-col items-center gap-5">
        <Logo />
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink">Complete your registration</h1>
          <p className="mt-1.5 text-[15px] text-dim">One-time $10 payment to unlock full access</p>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* Order summary */}
        <Card className="flex flex-col p-7">
          <Eyebrow>Student registration</Eyebrow>
          <div className="mt-5 flex items-end gap-2">
            <span className="nums text-5xl font-extrabold tracking-tightest text-ink">$10.00</span>
          </div>
          <p className="mt-1.5 text-sm text-dim">Once-off · lifetime access</p>
          <ul className="mt-7 flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14px] text-ink">
                <Icon name="check" className="h-[18px] w-[18px] shrink-0 text-grass-600" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Payment */}
        <Card className="p-7">
          {waiting ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Spinner />
              <h2 className="mt-4 text-lg font-bold text-ink">Check your phone</h2>
              <p className="mt-2 max-w-xs text-sm text-dim">{instructions}</p>
              <p className="mt-4 text-xs text-faint">Waiting for confirmation… this page updates automatically.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Payment method</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setMethod(m.key); setError(""); }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all duration-200",
                      method === m.key
                        ? "border-brand bg-brand-50/60 text-brand ring-2 ring-brand/15"
                        : "border-line text-ink hover:border-ink/20",
                    )}
                  >
                    <Icon name={m.icon} className="h-4 w-4 shrink-0" />
                    {m.label}
                  </button>
                ))}
              </div>

              {current.mobile ? (
                <div className="mt-5">
                  <Input
                    label={`${current.label} number`}
                    type="tel"
                    inputMode="numeric"
                    placeholder={current.placeholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-faint">You&apos;ll get a prompt on this number to approve the payment.</p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-dim">
                  You&apos;ll be taken to our secure payment page to pay by card, then returned here automatically.
                </p>
              )}

              {error && <p className="mt-3 text-sm text-danger">{error}</p>}

              <Button variant="accent" arrow onClick={handlePay} disabled={processing} className="mt-5 w-full py-3 text-[15px]">
                {processing ? (<><Spinner /> Starting payment</>) : "Pay $10.00"}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-faint">
                <Icon name="lock" className="h-3.5 w-3.5" />
                Secure payment · EcoCash, OneMoney &amp; card
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
