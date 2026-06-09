// Company logo helper. We derive a logo from the EMPLOYER's email domain only —
// never from the source job-board URL — so the brand shown belongs to the hiring
// company and never reveals where Featers sourced the listing.

import type { Job } from "./types";

const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "outlook.com", "live.com", "msn.com", "aol.com",
  "icloud.com", "me.com", "proton.me", "protonmail.com", "zoho.com", "mail.com",
]);

/** Pull a usable company domain out of an apply email, skipping free providers. */
export function companyDomain(email: string | null | undefined): string | null {
  const domain = email?.split("@")[1]?.toLowerCase().trim();
  if (!domain || FREE_PROVIDERS.has(domain)) return null;
  return domain;
}

/** A favicon-based logo URL for a domain (always resolves to *something*). */
export function logoForDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/** Best logo for a job: a stored logo_url, else one derived from its email domain. */
export function jobLogo(job: Pick<Job, "logo_url" | "apply_email">): string | null {
  if (job.logo_url) return job.logo_url;
  const d = companyDomain(job.apply_email);
  return d ? logoForDomain(d) : null;
}
