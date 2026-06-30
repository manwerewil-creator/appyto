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
  const t = name.trim().replace(/\s+/g, " ");
  if (!t) return null;
  // Collapse spaces/dots so "apply now", "ApplyNOW.co.zw" all normalise the same.
  const k = t.toLowerCase().replace(/[\s._-]+/g, "");
  if (/applynow|jobszimbabwe|vacancybox|feasters|appyto/.test(k)) return null;
  if (GENERIC.has(k)) return null;
  // Some posts carry a sentence fragment of the company description instead of a
  // real name (e.g. "was founded in response to the economic challenges..."). A
  // genuine employer name is short and has no sentence punctuation or verbs.
  if (t.length > 50 || t.split(" ").length > 6) return null;
  if (/[.!?]/.test(t)) return null;
  if (/\b(was|were|is|are|be|been|founded|established|provides?|offers?|aims?|seeks?|committed|response|economic|challenges?)\b/i.test(t)) return null;
  return t;
}
