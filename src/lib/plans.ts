// Subscription tiers — single source of truth, mirrored in the `plans` table.
export type PlanId = "free" | "free_plus" | "base" | "pro" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;
  dailyApplyCap: number;
  isPaid: boolean;
  blurb: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free:      { id: "free", name: "Free", priceUsd: 0, dailyApplyCap: 0, isPaid: false,
               blurb: "Browse and apply manually.", features: ["Browse all jobs", "Manual apply", "CV builder"] },
  free_plus: { id: "free_plus", name: "Free+", priceUsd: 0, dailyApplyCap: 5, isPaid: false,
               blurb: "Unlock auto-apply with your own Gemini key.", features: ["Everything in Free", "Auto-apply 5/day", "Smarter matching"] },
  base:      { id: "base", name: "Base", priceUsd: 17, dailyApplyCap: 15, isPaid: true,
               blurb: "For students serious about interviews.", features: ["Auto-apply 15/day", "Priority matching", "Application tracking"] },
  pro:       { id: "pro", name: "Pro", priceUsd: 25, dailyApplyCap: 50, isPaid: true,
               blurb: "Maximise your reach.", features: ["Auto-apply 50/day", "Priority queue", "Custom email templates"] },
  premium:   { id: "premium", name: "Premium", priceUsd: 60, dailyApplyCap: 150, isPaid: true,
               blurb: "Blanket the market.", features: ["Auto-apply 150/day", "Top priority", "Concierge onboarding"] },
};

export const PLAN_LIST = Object.values(PLANS).sort((a, b) => a.priceUsd - b.priceUsd);
export const PAID_PLANS = PLAN_LIST.filter((p) => p.isPaid);

// The Internships section is an upgrade feature — Pro and Premium unlock it.
// (Single source of truth: change this list to widen/narrow access.)
export const INTERNSHIP_PLANS: PlanId[] = ["pro", "premium"];
export const canAccessInternships = (planId?: string | null): boolean =>
  !!planId && (INTERNSHIP_PLANS as string[]).includes(planId);
