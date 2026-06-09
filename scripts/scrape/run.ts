// CLI entrypoint for the scrapers.
//
//   npm run scrape                      # both sources → data/jobs.json + CSV
//   npm run scrape -- --source=applynow # one source
//   npm run scrape -- --pages=3         # first N pages per source
//   npm run scrape:sample               # 2 pages per source
//
// Writes data/jobs.json (read by the web app) and a per-source CSV snapshot.

import { crawlWp } from "./wp-client.ts";
import { SOURCES } from "./sources.ts";
import { mergeJobsJson, writeCsv, pushToSheet } from "./store.ts";
import type { NormalizedJob } from "./types.ts";

interface Args { source?: string; pages?: number; }

function parseArgs(argv: string[]): Args {
  const a: Args = {};
  for (const arg of argv) {
    if (arg.startsWith("--source=")) a.source = arg.split("=")[1];
    else if (arg.startsWith("--pages=")) a.pages = Number(arg.split("=")[1]);
  }
  return a;
}

async function scrapeSource(sourceId: string, maxPages?: number) {
  const cfg = SOURCES[sourceId];
  if (!cfg) throw new Error(`Unknown source "${sourceId}". Use: ${Object.keys(SOURCES).join(", ")}`);

  console.log(`\n▶ Scraping ${sourceId} (${cfg.baseUrl}/wp-json/wp/v2/${cfg.restBase})`);
  const jobs: NormalizedJob[] = [];
  const start = Date.now();
  let withEmail = 0;

  for await (const post of crawlWp({
    baseUrl: cfg.baseUrl,
    restBase: cfg.restBase,
    maxPages,
    embed: true,
    onPage: (page, total, n) =>
      process.stdout.write(`\r  page ${page}/${total}  (+${n})  collected=${jobs.length}   `),
  })) {
    if (post.status !== "publish") continue;
    const job = cfg.normalize(post);
    if (job.apply_email) withEmail++;
    jobs.push(job);
  }

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\n  ✓ ${jobs.length} jobs in ${secs}s — ${withEmail} have an apply email ` +
      `(${jobs.length ? Math.round((withEmail / jobs.length) * 100) : 0}%)`,
  );

  const csvPath = await writeCsv(jobs, sourceId);
  console.log(`  ✓ CSV → ${csvPath}`);
  const total = await mergeJobsJson(jobs);
  console.log(`  ✓ data/jobs.json now holds ${total} jobs`);
  await pushToSheet(jobs);
  return jobs.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = args.source ? [args.source] : Object.keys(SOURCES);
  let total = 0;
  for (const s of sources) total += await scrapeSource(s, args.pages);
  console.log(`\n■ Done. Scraped ${total} jobs across ${sources.length} source(s).`);
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });
