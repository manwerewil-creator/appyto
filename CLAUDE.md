# CLAUDE.md — Featers

Engineering handoff doc. Read this top-to-bottom before changing anything.

> **Featers** (domain **feasters.cloud**, canonical **www.feasters.cloud**) is a
> Zimbabwe job-application tool. It scrapes every job from two boards, matches
> them to a user with pure code (no AI), and applies on the user's behalf by
> emailing the employer from the user's own inbox. Positioning everywhere:
> *"a tool to apply faster — not a guarantee of a job."*
>
> **UI rule (important):** never surface internals to users. Do **not** name the
> payment provider, the job-board sources, or "scraper/scraping" anywhere in the
> app. Listings must feel like Featers serves them directly.
>
> The repo folder is still named `Appyto` and the GitHub repo is
> `manwerewil-creator/appyto` — the product was renamed to **Featers** later.

---

## 1. Architecture (three independent runtimes)

```
┌──────────────┐   reads (RLS)    ┌──────────────┐   upserts (service role)  ┌────────────────────┐
│  Web app     │ ───────────────▶ │   Supabase   │ ◀───────────────────────  │  Scraper           │
│  Next.js 15  │                  │  Postgres +  │                            │  GitHub Actions    │
│  on Vercel   │                  │  Auth + Stor │                            │  (cron, npm scrape)│
└──────────────┘                  └──────────────┘                            └────────────────────┘
       │                                  ▲
   user browser                    Paynow → /api/billing/result (activates plan)
```

- **Web app** — Next.js App Router on Vercel. Only reads jobs; handles auth, matching, applications, billing UI.
- **Supabase** — source of truth: Postgres (+ RLS), Auth (Google provider), Storage (`cvs` bucket).
- **Scraper** — standalone Node script run by **GitHub Actions** every 6h; writes jobs to Supabase. Cannot run inside Vercel (serverless timeout vs 1800+ pages).
- **Paynow** — Zimbabwe payment gateway; server-to-server callback activates subscriptions.

## 2. Tech stack
- Next.js 15 (App Router, RSC), React 18, TypeScript
- Tailwind CSS 3 + **shadcn/ui** (components in `src/components/ui/`) + **lucide-react** icons
- `@supabase/ssr` + `@supabase/supabase-js`
- `nodemailer` (SMTP + Gmail OAuth2 sending)
- `cheerio` + `csv-stringify` (scraper)
- Font: **Inter Tight** via `next/font` (matches rylolabz.com)
- **framer-motion** for animation (always honour `prefers-reduced-motion`); **sonner** toasts (`<Toaster>` in layout)
- **web-push** for browser notifications. The `ui-ux-pro-max` Claude skill is installed (user scope) for design work.

## 3. Key files / directories
```
src/middleware.ts              Auth gate: refreshes Supabase session, redirects
                               unauth'd users to /login. PUBLIC[] = open paths.
src/app/layout.tsx             Root layout; loads Inter Tight; wraps <AppShell>.
src/components/app-shell.tsx   Responsive shell: desktop sidebar (w-52) + mobile
                               Sheet drawer + floating bottom nav. The TOP PANEL
                               shows the section title (brown, the SINGLE source —
                               pages must not repeat it) + notifications/settings/
                               profile. Self-excludes /login & /auth.
src/components/ui/*            shadcn primitives (button, card, badge, input,
                               label, separator, sheet, skeleton).
src/lib/supabase/client.ts     Browser client (anon).
src/lib/supabase/server.ts     supabaseServer() (user/RLS) + supabaseAdmin() (service role).
src/lib/auth.ts                getAuth() -> { sb, user } for route handlers.
src/lib/data.ts                CENTRAL data access (fetchJobs, fetchProfile,
                               saveProfile, fetchCreds, applications, resume...).
                               All routes go through here.
src/lib/match.ts               Pure-code job matching/scoring (no AI).
src/lib/apply.ts               applyToJob / autoApply (send + log + dedupe + cap).
src/lib/mailer.ts              SendConfig, makeTransport (SMTP or Gmail OAuth2),
                               buildEmail, sendApplication, emailReady, credsToConfig.
                               buildEmail() delegates to the email engine below.
src/lib/email/                 ALGORITHMIC email engine (no LLM, see §6.5):
                               spintax.ts (seeded spin), corpus.ts (tone banks),
                               detect.ts (job requirement detector), compose.ts.
src/lib/logo.ts                Company logo from the employer email domain (favicon).
src/lib/use-user.ts            Client hook: { name, email, avatar } from the session.
src/lib/crypto.ts              AES-256-GCM encrypt/decrypt (SMTP pass, Google token).
src/lib/google.ts              Gmail-send OAuth helpers (separate from login).
src/lib/paynow.ts              Paynow initiate + poll + SHA-512 hash.
src/lib/plans.ts               Tiers: free, free_plus, base $17, pro $25, premium $60.
src/lib/resume.ts              Resume model + 4 templates metadata + sample.
src/lib/types.ts               Job (+logo_url), Profile (+resources, resource_files),
                               ResourceLink, ResourceFile, Settings, Application.

src/app/page.tsx               Overview dashboard (shadcn cards).
src/app/jobs|matches|applications|profile|settings|billing|onboarding|quick-apply
src/app/resume/                CV builder (wizard + live A4 preview + print-to-PDF);
                               Templates.tsx = 4 pure-code CV templates.
src/app/login + auth/callback  Google login + OAuth callback.
src/app/api/**                 All API routes (see §6).

scripts/scrape/                The scraper (run.ts entry; wp-client, sources,
                               parse, store, env loader). `npm run scrape`.
scripts/google-apps-script/    Optional Google Sheet mirror.
supabase/schema.sql            FULL production schema (run in Supabase SQL editor).
.github/workflows/scrape.yml   Scheduled scraper (every 6h + manual dispatch).
vercel.json                    Vercel config + daily auto-apply cron.
DEPLOY.md                      Step-by-step external setup guide.
```

## 4. Data model (Supabase — `supabase/schema.sql`)
- `plans` — tiers (id, price_usd, daily_apply_cap, is_paid).
- `profiles` — 1:1 with `auth.users`; preferences arrays, cv_path, plan_id,
  daily_cap, onboarded, **resume jsonb** (CV builder doc). Auto-created by a
  trigger on signup. RLS: own row.
- `send_credentials` — per-user sending method (`smtp`|`google`), encrypted
  `secret_enc` / `google_refresh_enc`, verified. RLS: own row.
- `jobs` — shared catalogue (id = `${source}:${source_uid}`); public read,
  service-role write. Sources: `jobszimbabwe`, `applynow`, `custom`.
- `applications` — per-user log; UNIQUE(user_id, job_id). RLS: own row.
- `subscriptions` + `payments` — Paynow billing. RLS: own row.
- `activity_events` — append-only "memory" feed (Recent Activity). RLS: own row.
- `push_subscriptions` — Web Push endpoints per device. RLS: own row.
- `profiles.resources` (jsonb `[{label,url}]`) + `resource_files` (jsonb
  `[{name,path}]`) — extra application links/docs; links append to the email body,
  files attach alongside the CV.
- rpc `applications_today(p_user)` — quota helper.

## 5. The scraper (how jobs get in)
Both target sites are **WordPress**. We page their REST APIs (no HTML scraping):
- jobszimbabwe.co.zw → CPT `noo_job` at `/wp-json/wp/v2/noo_job` (~tens of thousands).
- applynow.co.zw → standard `posts` at `/wp-json/wp/v2/posts`.
`store.ts` maps to the `Job` shape and `upsertSupabase()` writes them (onConflict id).
Runs via **GitHub Actions** (`.github/workflows/scrape.yml`) every 6h. Needs repo
secrets `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (already set).
Manual run: Actions tab → "Scrape jobs into Supabase" → Run workflow (input
`pages` to bound it). Locally: `npm run scrape -- --pages=30`.

## 6. Auth & sending — TWO separate Google integrations (don't confuse them)
1. **Login** = Supabase Auth. Supports **email/password** (`signUp` /
   `signInWithPassword`; `/login` has first/last name + a password-visibility
   toggle) **and Google** (provider configured in the **Supabase dashboard**).
   Flow → `/auth/callback` (exchanges code, sets session cookies on the redirect
   response).
2. **Gmail send** = our OWN OAuth flow (`src/lib/google.ts`, `/api/google/*`),
   uses env `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (the SAME client works
   for both) with scope `gmail.send`. Lets a user send applications from their
   Gmail without a password. Alternative: SMTP App Password (no Google setup).

`gmail.send` is a Google **restricted scope** → needs app verification for
production scale (>100 users). SMTP App Password path avoids this.

## 6.5 Email generation (the "AI" — pure algorithmic, NO LLM)
`buildEmail(job, profile)` (mailer.ts) delegates to `src/lib/email/`:
- **detect.ts** — reads the job, flags what it wants (CV, cover letter, portfolio,
  certificates, references, a reference/vacancy code, a dictated subject) + infers
  sector & seniority.
- **compose.ts** — picks a tone from that, then assembles greeting → hook → pitch →
  fit → requirement-lines → CTA → sign-off from **corpus.ts** via **spintax.ts**, a
  *seeded* `{a|b|c}` spinner. Seed = job id + user email → same job always yields the
  same email (preview == what's sent) while every job differs.
- A user's saved `cover_letter_template` **overrides** the engine entirely.
- Corpus phrasing deliberately avoids em-dashes / AI tells. `npm run emails:samples`
  writes 100 samples to `data/email-samples.md` through this exact path.
- Resource links append to the body; resource files attach (see `apply.ts`).

## 7. Environment variables (`.env.local` locally; mirror in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET          # gmail.send (NOT needed for login)
PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY
APP_URL=https://www.feasters.cloud              # build return/result/redirect URLs
APPLY_ENCRYPTION_KEY                            # 32-byte hex, encrypts secrets
CRON_SECRET                                     # protects /api/cron/apply + /api/cron/notify
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT   # Web Push
```
`.env.local` is gitignored. `.env.example` has blank placeholders (safe to commit).

**Web Push** (`src/lib/push.ts`, `/api/push/{subscribe,unsubscribe}`,
`/api/cron/notify`, push handlers in `public/sw.js`, `NotificationBell` in the
top bar): user grants permission → browser subscription saved to
`push_subscriptions` → the notify cron (once daily — see Hobby cron limit in §8)
scores jobs scraped since each user's `profiles.jobs_notified_at` watermark and
pushes "N new jobs match you".
Setup: run `supabase/migrations/002_push_notifications.sql` in the Supabase SQL
editor and set the three VAPID vars in Vercel. Generate keys:
`node -e "console.log(require('web-push').generateVAPIDKeys())"`.

## 8. Deploy / ops
- GitHub: `manwerewil-creator/appyto` (private). `gh auth switch --user manwerewil-creator` to push.
- Vercel: project **`appyto`** lives under the personal scope
  **`manwerewil-creators-projects`** (account `manwerewil-creator`) — NOT the team
  the Vercel MCP can reach (it 404s there). To deploy manually: `vercel link
  --project appyto --scope manwerewil-creators-projects --token=…` then `vercel
  --prod`. Domain `feasters.cloud` (apex 308→`www`). Pushing to `main` auto-deploys.
  **Hobby (free) plan.**
- Supabase project ref: `ipcxdotvjfudtohzpnmy` (NOT the project connected to the
  Supabase MCP — run SQL in the dashboard, not via MCP).
- Crons (`vercel.json`): `/api/cron/apply` daily 06:00, `/api/cron/notify` daily 07:00
  (need CRON_SECRET + APP_URL in Vercel).
- Dev: `npm run dev` — we use **port 3010** (`next dev -p 3010`), matching APP_URL.
  Don't run `npm run build` / delete `.next` while a dev server is running (it kills it).

## 9. ⚠️ Gotchas already hit (so you don't repeat them)
- **Scraper `.ts` imports** keep `.ts` extensions (tsx needs them); `scripts/` is
  excluded from tsconfig so Next's type-check ignores them. Intra-`src/lib` imports
  must be extensionless.
- **shadcn theme is namespaced `--sb-*`** in `globals.css` + `tailwind.config.ts`
  to avoid colliding with the legacy CSS variables (`--brand`, `--border`, etc.)
  that some inline styles still use. Don't rename without checking both.
- **middleware `matcher` must exclude static files** (png/jpg/svg/woff…) or asset
  requests like `/logo.png` get redirected to `/login` (broke the logo once).
- **Service worker must NOT intercept navigations or `/auth`** or it breaks the
  OAuth callback (bounced users back to login). See `public/sw.js` (cache-first
  for static assets only). Bump `CACHE` version when changing it.
- **OAuth callback must write cookies onto the redirect response** (`auth/callback/route.ts`)
  — the generic `supabaseServer()` cookie writer swallows errors in route handlers.
- **Paynow test mode**: only the merchant email can pay until the integration is
  switched to **Live** in the Paynow dashboard.
- **Vercel Hobby = ONE cron run per day, max.** A `vercel.json` cron with a more
  frequent schedule (e.g. `0 */6 * * *`) makes **every deployment fail validation**,
  silently freezing production on the last good build. This bit us hard (deploys
  looked "stuck"). Keep all crons ≤ daily until on Pro.
- **Buttons are solid** (`button.tsx`) — no gradient fills, no hover-lift. Don't
  reintroduce "fading" gradient buttons.
- **Section titles live ONLY in the top panel** (brown, in `app-shell.tsx`). Don't
  add a page-level `<h1>` that repeats the section name (hero/marketing headlines
  that differ are fine, e.g. the dashboard hero or billing "Pick your plan").
- **Animations must honour `prefers-reduced-motion`** (framer-motion `useReducedMotion`).

## 10. Current status & TODO
**Done & live:** scrapers, Supabase migration, Google **+ email/password** login,
multi-user data layer, CV builder (4 templates, page-size preview), onboarding,
quick-apply, SMTP + Gmail-OAuth sending, **algorithmic email engine** (`src/lib/email`),
profile resources (links + files attached to applications), manual + daily-cron
auto-apply, Paynow billing (clean tile UI), Web Push + activity feed, full UI pass
(solid buttons, brown top-panel title, hero image, framer-motion), deployed to
www.feasters.cloud.

**Needs the owner (config, not code):**
- [ ] Set `GOOGLE_CLIENT_ID`/`SECRET` in **Vercel** env (lights up "Connect Gmail").
- [ ] Take Paynow integration **Live** to accept real payments.
- [ ] Confirm `CRON_SECRET` + `APP_URL` in Vercel (for the daily cron).

**Engineering TODO / next:**
- [ ] Verify end-to-end in prod: login → onboard → match → connect email → send.
- [ ] Gmail `gmail.send` app verification for >100 users.
- [ ] Auto-apply cron scales sequentially (4–6s/send) — add a queue for many users.
- [ ] Free+ tier: actually gate on a pasted Gemini key (currently plan logic only).
- [ ] Subscription expiry/renewal (Paynow is one-off charges; `period_end` set +30d but no auto-renew).
- [ ] Rename repo/folder from Appyto → Featers (cosmetic).
- [ ] Upgrade Vercel to Pro to restore 6-hourly notify cron (currently daily — Hobby limit).

## 11. Common commands
```
npm run dev -- -p 3010            # local dev on 3010 (matches APP_URL)
npm run build                     # production build (always run before pushing)
npm run emails:samples            # generate 100 sample emails → data/email-samples.md
npm run scrape -- --pages=30      # scrape N pages/source into Supabase + CSV
gh run list --repo manwerewil-creator/appyto      # scraper run history
```
