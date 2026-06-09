// HTML → clean text + structured apply-info extraction.
// Both sources bury the employer contact inside content.rendered, so this is
// where the real value gets mined out.

import * as cheerio from "cheerio";
import type { ApplyMethod } from "./types.ts";

const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Junk emails we never want as an apply target.
const EMAIL_BLOCKLIST =
  /(example\.com|sentry|wixpress|@2x|\.png|\.jpe?g|@sentry|noreply@wordpress)/i;

/** Strip tags/scripts/styles to readable plain text. */
export function htmlToText(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $.root()
    .text()
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** First plausible employer email found in the body. */
export function extractEmail(html: string, text: string): string | null {
  const haystack = `${text}\n${html}`;
  const matches = haystack.match(EMAIL_RE) ?? [];
  for (const m of matches) {
    const e = m.toLowerCase();
    if (!EMAIL_BLOCKLIST.test(e)) return e;
  }
  return null;
}

/** External application link if the post says "apply here" / has a form URL. */
export function extractApplyUrl(html: string, selfUrl: string): string | null {
  if (!html) return null;
  const $ = cheerio.load(html);
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) return;
    const href = ($(el).attr("href") || "").trim();
    const label = $(el).text().toLowerCase();
    const isApplyish =
      /apply|application|submit|vacanc|recruit|careers?|google\.com\/forms|forms\.gle|lnkd\.in|workable|greenhouse|lever\.co/i;
    if (!href || href.startsWith("mailto:") || href.startsWith("#")) return;
    if (href.includes(new URL(selfUrl).host)) return; // skip same-site nav
    if (isApplyish.test(href) || isApplyish.test(label)) found = href;
  });
  return found;
}

export function classifyApply(
  email: string | null,
  url: string | null,
  text: string,
): ApplyMethod {
  if (email) return "email";
  if (url) return "url";
  if (/how to apply|send your|submit your|applications? (should|must)|deadline/i.test(text))
    return "instructions";
  return "unknown";
}

/** Best-effort salary line. */
export function extractSalary(text: string): string | null {
  const m = text.match(
    /(salary|remuneration|wage|pay)[:\s-]*([^\n.]{2,60})/i,
  );
  if (m && /\d|negotiable|competitive|usd|\$|zwl/i.test(m[2])) return m[2].trim();
  const range = text.match(/(usd|\$|zwl)\s?\d[\d,.\s-]*(per month|pm|monthly|p\/m)?/i);
  return range ? range[0].trim() : null;
}

/**
 * Company name heuristics for jobszimbabwe, where the company is usually the
 * trailing segment of the title after a dash/"at", or stated in the body.
 */
export function guessCompanyFromTitle(title: string): string | null {
  // "DRIVERS X2 – Luxon Solar System & Installations"
  const dash = title.split(/\s[–—-]\s/);
  if (dash.length >= 2) {
    const tail = dash[dash.length - 1].trim();
    if (tail.length > 1 && tail.length < 80) return tail;
  }
  const at = title.match(/\bat\s+([A-Z][\w&.,'\- ]{2,60})$/);
  if (at) return at[1].trim();
  return null;
}

export function companyFromBody(text: string): string | null {
  const m = text.match(/\b(company|employer|organisation|organization)[:\s]+([^\n.]{2,70})/i);
  return m ? m[2].trim() : null;
}

export function decodeEntities(s: string): string {
  return cheerio.load(`<x>${s}</x>`)("x").text();
}
