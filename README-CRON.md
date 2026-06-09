# Automation: scraping, enqueue, apply

Appyto's automation runs in three stages on a schedule. Each stage is small and
idempotent, so a missed or repeated run never double-applies or corrupts state.

> Honest positioning: this is a tool to apply to jobs **faster** — never a
> guarantee of a job. The cron only sends applications a user has been matched
> to, from the user's own mailbox, capped by their plan.

## The pipeline

```
1. SCRAPE   (GitHub Action / npm run scrape)   ── fills public.jobs
        │
        ▼
2. ENQUEUE  (Vercel Cron, daily 06:00 UTC)     ── matches prefs → 'queued' applications
        │   GET /api/cron/enqueue
        ▼
3. APPLY    (Vercel Cron, hourly)              ── sends queued applications via SMTP
            GET /api/cron/apply
```

### 1. Scrape — fills the job board

The scraper is **not** a Vercel cron. It runs out-of-band via a GitHub Action
(or manually) and writes into `public.jobs`:

```bash
npm run scrape
```

Recommended cadence: a few times a day via a scheduled GitHub Action. Source
sites are Zimbabwean job boards. The scraper upserts on `(source, source_uid)`
and flips `is_open` for jobs that have closed, so running it often is safe.

### 2. Enqueue — `GET /api/cron/enqueue` (daily, 06:00 UTC)

For every **onboarded** user whose plan allows auto-apply
(`dailyApplyCap > 0` — i.e. `free_plus`, `base`, `mid`, `premium`):

- loads their saved preferences and plan,
- computes `remaining = dailyApplyCap − applications_today`,
- ranks the open jobs with the pure-code matcher (`@/lib/match`),
- keeps only jobs we can actually email (`apply_method === 'email'` + an
  `apply_email`),
- drops any job the user already has an application row for,
- inserts the top `remaining` as `status = 'queued'`.

Free tier (`dailyApplyCap === 0`) is skipped entirely — free users apply
manually from the UI.

### 3. Apply — `GET /api/cron/apply` (hourly)

For every user with at least one `queued` application:

- best-effort downloads their CV from the `cvs` Storage bucket
  (`profiles.cv_url`); if there's no CV or the download fails, it sends without
  an attachment,
- calls `runApplyForUser`, which re-checks the daily cap, sends each queued
  application from the user's own verified SMTP credentials, paces sends with a
  human-like delay, and updates each row to `sent` / `failed` / `skipped`.

Running hourly lets a large queue drain across the day while staying under each
user's cap (the cap is re-checked every run, never exceeded).

## Security

Both cron endpoints are protected. Vercel Cron automatically sends:

```
Authorization: Bearer <CRON_SECRET>
```

The routes compare the `authorization` header against `Bearer ${CRON_SECRET}`
exactly and return **401** otherwise. If `CRON_SECRET` is unset, every request
is rejected (fail-closed).

## Required environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | Vercel project env | Shared secret Vercel Cron sends as the bearer token; gates both cron routes. |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + scraper | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) + scraper | Service-role key — the cron has no user session and queries with RLS bypassed, scoped by `user_id` in code. |
| `APP_SECRET` / crypto key | Vercel | Used by `@/lib/apply/crypto` to decrypt each user's SMTP secret. |

> `CRON_SECRET` is the one this slice introduces. Set it in the Vercel
> dashboard (Project → Settings → Environment Variables). Vercel injects the
> matching bearer token into scheduled invocations automatically.

## Testing locally

```bash
# Enqueue
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/enqueue

# Apply
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/apply
```

Without the header you should get `401 {"error":"Unauthorized"}`.

## Schedules (`vercel.json`)

| Endpoint | Cron | Meaning |
| --- | --- | --- |
| `/api/cron/enqueue` | `0 6 * * *` | Daily at 06:00 UTC — refill each user's queue for the day. |
| `/api/cron/apply` | `0 * * * *` | Every hour — drain queued applications within caps. |

Vercel cron times are **UTC**.
