"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Eyebrow, Input, Spinner, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";

type Method = "ecocash" | "onemoney" | "visa" | "bank";

const METHODS: { key: Method; label: string; icon: "card" | "dollar"; placeholder: string }[] = [
  { key: "ecocash", label: "EcoCash", icon: "card", placeholder: "EcoCash number e.g. 0771 234 567" },
  { key: "onemoney", label: "OneMoney", icon: "card", placeholder: "OneMoney number e.g. 0712 345 678" },
  { key: "visa", label: "Visa / Mastercard", icon: "card", placeholder: "Card number e.g. 4111 1111 1111 1111" },
  { key: "bank", label: "Bank Transfer", icon: "dollar", placeholder: "Bank account / reference number" },
];

const FEATURES = [
  "Unlimited applications",
  "CV & document storage",
  "Direct recruiter messaging",
  "Real-time status tracking",
  "Application history",
  "Priority placement alerts",
];

function randomRef() {
  return "VB-" + Math.random().toString(36).slice(2, 9).toUpperCase();
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("ecocash");
  const [fieldValue, setFieldValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("vb_profiles")
        .select("paid")
        .eq("id", data.user.id)
        .single();

      if (profile?.paid) {
        router.push("/student");
        return;
      }
      setUserId(data.user.id);
      setChecking(false);
    })();
  }, [router]);

  async function handlePay() {
    if (!userId) return;
    if (!fieldValue.trim()) {
      setError("Please enter your payment details.");
      return;
    }
    setProcessing(true);
    setError("");
    const supabase = createClient();

    const { error: payErr } = await supabase.from("vb_payments").insert({
      student_id: userId,
      amount: 10,
      currency: "USD",
      method,
      reference: randomRef(),
      status: "completed",
    });

    if (payErr) {
      setError("Payment recording failed. Please try again.");
      setProcessing(false);
      return;
    }

    await supabase.from("vb_profiles").update({ paid: true }).eq("id", userId);

    await supabase.from("vb_notifications").insert({
      user_id: userId,
      body: "Welcome to VisionBridge! Your registration is confirmed. Start browsing vacancies.",
      link: "/student",
      read: false,
    });

    router.push("/student");
  }

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper">
        <Spinner />
      </div>
    );
  }

  const currentMethod = METHODS.find((m) => m.key === method)!;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-16">
      {/* Logo + heading */}
      <div className="mb-10 flex flex-col items-center gap-5">
        <Logo />
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink">Complete your registration</h1>
          <p className="mt-1.5 text-[15px] text-dim">One-time payment to unlock full access</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid w-full max-w-3xl gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT — order summary */}
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

        {/* RIGHT — payment */}
        <Card className="p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Payment method</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMethod(m.key); setFieldValue(""); }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-sm font-semibold transition-all duration-200",
                  method === m.key
                    ? "border-brand bg-brand-50/60 ring-2 ring-brand/15 text-brand"
                    : "border-line text-ink hover:border-ink/20"
                )}
              >
                <Icon name={m.icon} className="h-4 w-4 shrink-0" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <Input
              label={`${currentMethod.label} details`}
              type="text"
              placeholder={currentMethod.placeholder}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
            />
          </div>

          {error && (
            <p className="mt-3 text-sm text-danger">{error}</p>
          )}

          <Button
            variant="accent"
            arrow
            onClick={handlePay}
            disabled={processing}
            className="mt-5 w-full py-3 text-[15px]"
          >
            {processing ? (
              <>
                <Spinner /> Processing
              </>
            ) : (
              "Pay $10.00"
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-faint">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Demo gateway — production drops in EcoCash / Paynow / Stripe here.
          </div>
        </Card>
      </div>
    </div>
  );
}
