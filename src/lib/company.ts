// UI rule (see CLAUDE.md): never surface the job-board sources to users.
// Some scraped jobs carry the source/site account as their "company"
// (e.g. "ApplyNOW", "Jobs Zimbabwe", the WordPress "admin" author). This strips
// those so listings feel like Feasters serves them directly. Real employer names
// pass through untouched.

const GENERIC = new Set([
  "admin", "administrator", "wpadmin", "author", "editor", "staff",
  "hr", "recruitment", "vacancies", "careers", "jobs", "team",
]);

export function cleanCompany(name?: string | null): string | null {
  if (!name) return null;
  const t = name.trim();
  if (!t) return null;
  // Collapse spaces/dots so "apply now", "ApplyNOW.co.zw" all normalise the same.
  const k = t.toLowerCase().replace(/[\s._-]+/g, "");
  if (/applynow|jobszimbabwe|feasters|appyto/.test(k)) return null;
  if (GENERIC.has(k)) return null;
  return t;
}
