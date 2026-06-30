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
  /** Total applications a user may ever send on this tier (free tiers). Omit = unlimited. */
  lifetimeSendLimit?: number;
}

// Free tier: total applications a user can send before they must upgrade.
export const FREE_SEND_LIMIT = 5;

export const PLANS: Record<PlanId, Plan> = {
  free:      { id: "free", name: "Free", priceUsd: 0, dailyApplyCap: 0, isPaid: false, lifetimeSendLimit: FREE_SEND_LIMIT,
               blurb: "Try it free — 5 applications on us.",
               features: ["Browse every job in Zimbabwe", "5 free applications", "Apply from your own Gmail"] },
  free_plus: { id: "free_plus", name: "Free+", priceUsd: 0, dailyApplyCap: 5, isPaid: false,
               blurb: "Auto-apply free with your own AI key.",
               features: ["Everything in Free", "Auto-apply up to 5/day (your AI key)"] },
  base:      { id: "base", name: "Base", priceUsd: 17, dailyApplyCap: 15, isPaid: true,
               blurb: "Start landing interviews.",
               features: ["Smart job matching", "Pro CV builder · 4 templates", "Auto-apply up to 15/day", "Unlimited applications", "Application tracking"] },
  pro:       { id: "pro", name: "Pro", priceUsd: 25, dailyApplyCap: 50, isPaid: true,
               blurb: "Maximise your reach — internships included.",
               features: ["Everything in Base", "Attachment & internship jobs", "Auto-apply up to 50/day", "Priority send queue", "Custom email templates"] },
  premium:   { id: "premium", name: "Premium", priceUsd: 60, dailyApplyCap: 150, isPaid: true,
               blurb: "Blanket the market.",
               features: ["Everything in Pro", "Auto-apply up to 150/day", "Top priority queue", "Early access to new jobs", "Concierge onboarding"] },
};

export const PLAN_LIST = Object.values(PLANS).sort((a, b) => a.priceUsd - b.priceUsd);
export const PAID_PLANS = PLAN_LIST.filter((p) => p.isPaid);

/** Any paid tier (Base and up). */
export const isPaidPlan = (planId?: string | null): boolean =>
  !!PLANS[(planId as PlanId) ?? "free"]?.isPaid;

// The CV builder and job matching require a paid plan (Base and up).
export const canBuildCv = (planId?: string | null): boolean => isPaidPlan(planId);
export const canGetMatched = (planId?: string | null): boolean => isPaidPlan(planId);

// The attachment / internship section is a higher-tier upgrade — Pro and Premium
// unlock it. (Single source of truth: change this list to widen/narrow access.)
export const INTERNSHIP_PLANS: PlanId[] = ["pro", "premium"];
export const canAccessInternships = (planId?: string | null): boolean =>
  !!planId && (INTERNSHIP_PLANS as string[]).includes(planId);

// Total applications allowed on a plan before the user must upgrade (null = unlimited).
export const sendLimitOf = (planId?: string | null): number | null =>
  PLANS[(planId as PlanId) ?? "free"]?.lifetimeSendLimit ?? null;
