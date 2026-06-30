// Per-site adapters: turn a raw WpPost into a NormalizedJob.
//
// jobszimbabwe.co.zw → "NOO JobMonster" theme, CPT `noo_job`. Taxonomies:
//   job_category, job_location, job_type, job_tag (in _embedded["wp:term"]).
//   `_closing` is a unix-seconds deadline.
// applynow.co.zw → standard `post`. Jobs live in categories (Zimbabwe, Remote…)
//   and the apply contact / deadline is inside the body.

import type { NormalizedJob, WpPost } from "./types.ts";
import {
  htmlToText,
  extractEmail,
  extractApplyUrl,
  classifyApply,
  extractSalary,
  guessCompanyFromTitle,
  companyFromBody,
  decodeEntities,
} from "./parse.ts";

type TermBucket = Record<string, string[]>;

// Derive a company logo from the EMPLOYER's email domain only (never the source
// job board), skipping free mail providers. Falls back to null → UI shows a
// coloured monogram.
const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "outlook.com", "live.com", "msn.com", "aol.com",
  "icloud.com", "me.com", "proton.me", "protonmail.com", "zoho.com", "mail.com",
]);
function logoFromEmail(email: string | null): string | null {
  const domain = email?.split("@")[1]?.toLowerCase().trim();
  if (!domain || FREE_PROVIDERS.has(domain)) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function termsByTaxonomy(post: WpPost): TermBucket {
  const out: TermBucket = {};
  const groups = post._embedded?.["wp:term"] ?? [];
  for (const group of groups) {
    for (const term of group ?? []) {
      (out[term.taxonomy] ??= []).push(decodeEntities(term.name));
    }
  }
  return out;
}

function isoOrNull(s?: string | null): string | null {
  if (!s) return null;
  // WP gmt strings lack the Z; append it.
  const d = new Date(/Z$/.test(s) ? s : `${s}Z`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export interface SourceConfig {
  id: NormalizedJob["source"];
  baseUrl: string;
  restBase: string;
  normalize: (post: WpPost) => NormalizedJob;
}

// ─── jobszimbabwe ────────────────────────────────────────────────────────────
const jobszimbabwe: SourceConfig = {
  id: "jobszimbabwe",
  baseUrl: "https://jobszimbabwe.co.zw",
  restBase: "noo_job",
  normalize(post) {
    const html = post.content?.rendered ?? "";
    const text = htmlToText(html);
    const t = termsByTaxonomy(post);
    const title = decodeEntities(post.title?.rendered ?? "").trim();

    const email = extractEmail(html, text);
    const applyUrl = extractApplyUrl(html, post.link);
    const closing =
      typeof post._closing === "number" && post._closing > 0
        ? new Date(post._closing * 1000).toISOString()
        : null;

    return {
      source: "jobszimbabwe",
      source_uid: String(post.id),
      url: post.link,
      title,
      company:
        t.noo_company?.[0] ??
        guessCompanyFromTitle(title) ??
        companyFromBody(text),
      location: t.job_location?.[0] ?? null,
      category: t.job_category?.[0] ?? null,
      job_type: t.job_type?.[0] ?? null,
      tags: t.job_tag ?? [],
      description: text,
      description_html: html,
      apply_email: email,
      apply_url: applyUrl,
      apply_method: classifyApply(email, applyUrl, text),
      salary: extractSalary(text),
      posted_at: isoOrNull(post.date_gmt),
      closes_at: closing,
      is_open: closing ? new Date(closing) > new Date() : post.status === "publish",
      logo_url: logoFromEmail(email),
      raw: post,
    };
  },
};

// ─── applynow ────────────────────────────────────────────────────────────────
const applynow: SourceConfig = {
  id: "applynow",
  baseUrl: "https://applynow.co.zw",
  restBase: "posts",
  normalize(post) {
    const html = post.content?.rendered ?? "";
    const text = htmlToText(html);
    const t = termsByTaxonomy(post);
    const title = decodeEntities(post.title?.rendered ?? "").trim();

    const email = extractEmail(html, text);
    const applyUrl = extractApplyUrl(html, post.link);
    // Categories are location/region buckets (Zimbabwe, Remote, US Canada…).
    const cats = t.category ?? [];
    const location =
      cats.find((c) => /zimbabwe|harare|remote|africa|us|canada|europe/i.test(c)) ??
      cats[0] ??
      null;

    return {
      source: "applynow",
      source_uid: String(post.id),
      url: post.link,
      title,
      // applynow titles often read "<Org> is hiring: <Role>". Never fall back to
      // the post author — on applynow that's the site account ("ApplyNOW"), which
      // would leak the source into the UI as a company name.
      company:
        (title.match(/^(.*?)\s+is hiring/i)?.[1] ?? null) ||
        companyFromBody(text) ||
        null,
      location,
      category: cats[0] ?? null,
      job_type: /consultanc|contract/i.test(text)
        ? "Contract"
        : /intern/i.test(text)
          ? "Internship"
          : "Full Time",
      tags: t.post_tag ?? [],
      description: text,
      description_html: html,
      apply_email: email,
      apply_url: applyUrl,
      apply_method: classifyApply(email, applyUrl, text),
      salary: extractSalary(text),
      posted_at: isoOrNull(post.date_gmt),
      closes_at: null, // deadline only in free text; left to enrichment
      is_open: post.status === "publish",
      logo_url: logoFromEmail(email),
      raw: post,
    };
  },
};

// ─── vacancybox ──────────────────────────────────────────────────────────────
// "WP Job Manager" CPT `job_listing` (rest_base `job-listings`). Taxonomies:
//   job_listing_category, job_listing_type, job_listing_region.
// The employer contact lives in the post body (≈85% expose an apply email).
// Cloudflare-fronted and uncached → pages are slow (~30s); the crawler's retry
// and politeness delay already absorb that.
const vacancybox: SourceConfig = {
  id: "vacancybox",
  baseUrl: "https://vacancybox.co.zw",
  restBase: "job-listings",
  normalize(post) {
    const html = post.content?.rendered ?? "";
    const text = htmlToText(html);
    const t = termsByTaxonomy(post);
    const title = decodeEntities(post.title?.rendered ?? "").trim();

    const email = extractEmail(html, text);
    const applyUrl = extractApplyUrl(html, post.link);

    return {
      source: "vacancybox",
      source_uid: String(post.id),
      url: post.link,
      title,
      // No company taxonomy here, and the body has no reliable "Company:" line —
      // companyFromBody() tends to grab a description fragment. Use only the safe
      // title-tail guess ("… – Acme Ltd"); otherwise leave it null (UI shows a
      // monogram). The app's cleanCompany() is the final guard at render time.
      company: guessCompanyFromTitle(title),
      location: t.job_listing_region?.[0] ?? null,
      category: t.job_listing_category?.[0] ?? null,
      job_type: t.job_listing_type?.[0] ?? null,
      tags: t.job_listing_category ?? [],
      description: text,
      description_html: html,
      apply_email: email,
      apply_url: applyUrl,
      apply_method: classifyApply(email, applyUrl, text),
      salary: extractSalary(text),
      posted_at: isoOrNull(post.date_gmt),
      closes_at: null, // deadline only in free text
      is_open: post.status === "publish",
      logo_url: logoFromEmail(email),
      raw: post,
    };
  },
};

export const SOURCES: Record<string, SourceConfig> = { jobszimbabwe, applynow, vacancybox };
