// Generic, polite WordPress REST client.
//
// Both target sites run WordPress and expose /wp-json/wp/v2/<rest_base>. We page
// through with per_page=100 and follow the X-WP-TotalPages header, which is the
// efficient, structured path — no HTML pagination scraping, no brittle selectors.

import type { WpPost } from "./types.ts";

const UA =
  process.env.SCRAPE_USER_AGENT ??
  "AppytoBot/1.0 (+https://appyto.co.zw/bot)";
const DELAY_MS = Number(process.env.SCRAPE_DELAY_MS ?? 350);
const CONCURRENCY = Number(process.env.SCRAPE_CONCURRENCY ?? 4);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch with retry + exponential backoff. Honors Retry-After on 429/503. */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  attempt = 0,
): Promise<Response> {
  const MAX = 5;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, Accept: "application/json", ...init.headers },
    });
    if ((res.status === 429 || res.status >= 500) && attempt < MAX) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = retryAfter ? retryAfter * 1000 : 2 ** attempt * 1000;
      console.warn(`  ↻ ${res.status} on ${url} — retry in ${wait}ms`);
      await sleep(wait);
      return fetchWithRetry(url, init, attempt + 1);
    }
    return res;
  } catch (err) {
    if (attempt < MAX) {
      const wait = 2 ** attempt * 1000;
      console.warn(`  ↻ network error on ${url} — retry in ${wait}ms`);
      await sleep(wait);
      return fetchWithRetry(url, init, attempt + 1);
    }
    throw err;
  }
}

export interface CrawlOptions {
  baseUrl: string;     // e.g. https://jobszimbabwe.co.zw
  restBase: string;    // e.g. noo_job | posts
  perPage?: number;    // default 100 (WP max)
  maxPages?: number;   // cap for testing; undefined = all
  embed?: boolean;     // include _embedded taxonomies/author
  onPage?: (page: number, totalPages: number, count: number) => void;
}

/**
 * Async-generate every post for a WP REST collection, page by page.
 * Yields raw WpPost objects; adapters normalize them.
 */
export async function* crawlWp(opts: CrawlOptions): AsyncGenerator<WpPost> {
  const perPage = opts.perPage ?? 100;
  const embed = opts.embed ?? true;
  let page = 1;
  let totalPages = 1;

  do {
    const u = new URL(`${opts.baseUrl}/wp-json/wp/v2/${opts.restBase}`);
    u.searchParams.set("per_page", String(perPage));
    u.searchParams.set("page", String(page));
    u.searchParams.set("orderby", "date");
    u.searchParams.set("order", "desc");
    if (embed) u.searchParams.set("_embed", "1");

    const res = await fetchWithRetry(u.toString());

    // WP returns 400 with code rest_post_invalid_page_number once you page past
    // the end — treat that as a clean stop.
    if (res.status === 400) break;
    if (!res.ok) {
      console.warn(`  ✗ ${res.status} fetching page ${page} of ${opts.restBase}`);
      break;
    }

    if (page === 1) {
      totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1") || 1;
      if (opts.maxPages) totalPages = Math.min(totalPages, opts.maxPages);
    }

    const batch = (await res.json()) as WpPost[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    opts.onPage?.(page, totalPages, batch.length);
    for (const post of batch) yield post;

    page += 1;
    await sleep(DELAY_MS); // politeness between pages
  } while (page <= totalPages);
}

/** Run an async mapper over items with a fixed concurrency ceiling. */
export async function mapPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency = CONCURRENCY,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}
