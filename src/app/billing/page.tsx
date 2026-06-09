"use client";

import { useEffect, useState } from "react";
import PageHeader from "../_components/PageHeader";
import { PAID_PLANS, PlanId } from "@/lib/plans";
import styles from "./billing.module.css";

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
    <>
      <PageHeader title="Billing" subtitle="Pick a plan that matches how hard you're job-hunting" />
      <div className="content grid" style={{ gap: 18 }}>
        {error && (
          <div className="card" style={{ background: "var(--red-soft)", borderColor: "#f3c9c9", color: "var(--red)" }}>{error}</div>
        )}

        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          Free and Free+ stay free forever — Free+ even auto-applies 5/day with your own key.
          Paid plans simply raise your daily auto-apply cap. No refunds on partial months, cancel anytime.
        </p>

        <div className={styles.grid}>
          {PAID_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className={`card ${styles.plan} ${isCurrent ? styles.planCurrent : ""}`}>
                <div className="spread">
                  <h3 className={styles.name}>{plan.name}</h3>
                  {isCurrent && <span className="badge sent">Current</span>}
                </div>
                <div>
                  <span className={styles.price}>${plan.priceUsd}</span>
                  <span className={styles.per}> /month</span>
                </div>
                <p className={styles.blurb}>{plan.blurb}</p>
                <ul className={styles.features}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.feature}>
                      <span className={styles.check}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.spacer} />
                <button
                  className="btn"
                  disabled={busy !== null || isCurrent}
                  onClick={() => upgrade(plan.id)}
                >
                  {busy === plan.id ? <span className="spinner" /> : isCurrent ? "Your plan" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <p className={styles.note}>
          Payments are handled by Paynow (EcoCash, OneMoney, Visa/Mastercard). You'll be redirected to pay securely,
          then brought back here once it's confirmed.
        </p>
      </div>
    </>
  );
}
