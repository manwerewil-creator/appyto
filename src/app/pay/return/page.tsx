"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Spinner } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";

// Where Paynow returns the browser after a card payment. We poll our own status
// endpoint (which re-checks Paynow + grants access) and forward to /student.
export default function PayReturn() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "paid" | "pending">("checking");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    if (!ref) { setState("pending"); return; }
    let tries = 0;
    const tick = async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/vb/pay/status?ref=${encodeURIComponent(ref)}`, { cache: "no-store" });
        const j = await r.json();
        if (j.status === "paid") {
          if (timer.current) clearInterval(timer.current);
          setState("paid");
          setTimeout(() => router.push("/student"), 900);
          return;
        }
      } catch { /* keep trying */ }
      if (tries >= 40) { if (timer.current) clearInterval(timer.current); setState("pending"); }
    };
    tick();
    timer.current = setInterval(tick, 4500);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {state === "checking" && (
          <>
            <Spinner />
            <h1 className="mt-4 text-xl font-bold text-ink">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-dim">This only takes a moment.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-grass-50 text-grass-600">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-ink">Payment confirmed</h1>
            <p className="mt-2 text-sm text-dim">Taking you to your dashboard…</p>
          </>
        )}
        {state === "pending" && (
          <>
            <h1 className="text-xl font-bold text-ink">Still processing</h1>
            <p className="mt-2 text-sm text-dim">
              If you completed the payment, your access unlocks as soon as it clears. You can head to your dashboard and it&apos;ll be ready.
            </p>
            <Button variant="primary" className="mt-5 w-full py-3" onClick={() => router.push("/student")}>
              Go to dashboard
            </Button>
            <Link href="/pay" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
              Try paying again
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
