"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLANS, PlanId } from "@/lib/plans";
import styles from "../billing.module.css";

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
    <div className="content">
      <div className={`card ${styles.returnWrap}`}>
        {paid ? (
          <>
            <h1 className={styles.returnTitle}>Payment confirmed 🎉</h1>
            <p className={styles.returnSub}>You're on {planName}! Your daily auto-apply cap has been raised.</p>
          </>
        ) : done ? (
          <>
            <h1 className={styles.returnTitle}>Awaiting confirmation…</h1>
            <p className={styles.returnSub}>
              We haven't seen Paynow confirm this payment yet. If you completed it, your plan will update
              automatically within a few minutes — no need to pay again.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.returnTitle}>Confirming your payment…</h1>
            <p className={styles.returnSub}>
              <span className="spinner" /> Checking with Paynow…
            </p>
          </>
        )}
        <Link className="btn ghost" href="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
