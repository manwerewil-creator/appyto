// Plan tiers — mirrored in the `plans` table.
//
// Billing was removed, so nothing is bought or sold here any more. A plan now
// only decides how many applications the nightly auto-apply run may send for a
// user; every feature of the app is open to everyone. `plan_id` survives on the
// profile purely as that daily allowance.
export type PlanId = "free" | "free_plus" | "base" | "pro" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  /** How many applications auto-apply may send per day. 0 disables auto-apply. */
  dailyApplyCap: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free:      { id: "free", name: "Free", dailyApplyCap: 15 },
  free_plus: { id: "free_plus", name: "Free+", dailyApplyCap: 15 },
  base:      { id: "base", name: "Base", dailyApplyCap: 15 },
  pro:       { id: "pro", name: "Pro", dailyApplyCap: 50 },
  premium:   { id: "premium", name: "Premium", dailyApplyCap: 150 },
};

export const PLAN_LIST = Object.values(PLANS);

/** Daily auto-apply allowance for a profile's plan. */
export const dailyCapOf = (planId?: string | null): number =>
  PLANS[(planId as PlanId) ?? "free"]?.dailyApplyCap ?? 0;
