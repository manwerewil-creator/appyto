# Appyto

Apply to Zimbabwean jobs faster. Appyto aggregates every public job posting from
**jobszimbabwe.co.zw** and **applynow.co.zw** into one searchable database, matches
them to a candidate's profile with pure code (no AI), and — on the user's behalf and
from the user's own mailbox — applies automatically up to their plan's daily cap.

> **Honest positioning:** Appyto is a tool to apply *faster*. It is not a promise of a job.

## Architecture

```
Next.js 15 (App Router, Vercel)  ──>  Supabase (Postgres + Auth + Storage)
        │                                   ▲
        │ cron: enqueue + apply             │ upsert jobs
        ▼                                   │
  per-user SMTP send (nodemailer)     Scrapers (Node/tsx)  ──>  CSV + Google Sheet mirror
```

- **Scrapers** (`scripts/scrape/`) — hit each site's WordPress REST API
  (`/wp-json/wp/v2/noo_job` and `/wp-json/wp/v2/posts`), normalize, extract the
  employer apply-email from the body, and upsert into Supabase + write a CSV.
- **Database** (`supabase/schema.sql`) — jobs, plans, profiles, send_credentials,
  applications, quota function, RLS.
- **App** (`src/`) — homepage with the real job counter + 50-job preview + pricing,
  auth, onboarding (CV + preferences), dashboard, settings (Gemini unlock + SMTP
  creds), and cron-driven match-queue + send.

## Why both sites were easy to scrape well
Both run WordPress. Instead of scraping fragile HTML pagination we page the REST
API (`per_page=100`, follow `X-WP-TotalPages`) and read `_embedded` taxonomies for
category/location/type. jobszimbabwe exposes ~7 sitemaps of `noo_job` postings, so
the real database is genuinely tens of thousands of jobs — the homepage counter
shows the **real** number.

## Quick start

```bash
npm install
cp .env.example .env        # fill in Supabase + keys

# 1. Create the database
#    Paste supabase/schema.sql into the Supabase SQL editor (or supabase db push).
#    Create a public Storage bucket named "cvs".

# 2. Run the scrapers (writes CSV always; DB when env is set)
npm run scrape:sample              # smoke test: 1 page/site, no DB
npm run scrape                     # full crawl of both sites -> Supabase + CSV
npm run scrape -- --source=applynow

# 3. Run the app
npm run dev
```

### Scraper flags
| Command | Effect |
| --- | --- |
| `npm run scrape` | Both sources → Supabase + CSV (+ Sheet if webhook set) |
| `npm run scrape -- --source=jobszimbabwe` | One source |
| `npm run scrape -- --pages=2 --no-db` | First 2 pages, CSV only |
| `npm run scrape:sample` | 1 page/site, no DB (CI smoke test) |

Politeness is configurable in `.env`: `SCRAPE_CONCURRENCY`, `SCRAPE_DELAY_MS`,
`SCRAPE_USER_AGENT`. Defaults are conservative (4 concurrent, 350 ms between pages)
to stay a good citizen and avoid rate-limit bans.

## Plans / tiers (mirrored in `src/lib/plans.ts` ⇄ `plans` table)
| Plan | Price | Visible jobs | Auto-apply/day | Unlock |
| --- | --- | --- | --- | --- |
| Free | $0 | 10 | — | sign up |
| Free+ | $0 | all | 5 | paste a Gemini API key |
| Base | $17 | all | 15 | pay |
| Pro | $25 | all | 50 | pay |
| Premium | $60 | all | 150 | pay |

## Auto-apply: how it stays defensible (not spam)
- Sends **from each user's own Gmail/SMTP** credentials (encrypted at rest,
  AES-256-GCM via `APPLY_ENCRYPTION_KEY`), **to** the employer email on the job.
- Hard **daily cap per plan**; **deduped** so a user never applies to a job twice;
  **human-paced** (~4–6 s jittered between sends, small batches per cron run).
- No shared sending pool, no identity rotation. It is genuinely *the user applying*.

## Scheduling
- **Scraping:** run `npm run scrape` on a schedule (GitHub Action or a small VM/cron).
- **Matching + sending:** Vercel Cron hits `/api/cron/enqueue` (daily) and
  `/api/cron/apply` (hourly), authorized by `CRON_SECRET`. See `vercel.json`.

## Google Sheet mirror (optional)
Deploy `scripts/google-apps-script/Code.gs` as a Sheets Web App and put its `/exec`
URL in `GOOGLE_SHEETS_WEBHOOK_URL`. The scraper then upserts rows into the Sheet by
`source|source_uid`. The CSV in `./data` is always written regardless.

## Status
- ✅ Both scrapers — built and verified live (200 jobs pulled in a smoke run,
  74% / 48% with extractable apply-emails).
- ✅ Schema, plan model, pure-code matcher, encryption + send engine.
- 🚧 App UI + API routes + cron wiring — generated; run `npm run build` to verify.
```
