# Appyto — Production Deployment Guide

Four workstreams take Appyto from "runs on your laptop" to "live on your domain":
**Supabase** (DB + Google login) → **Paynow** (payments) → **Vercel** (hosting + domain).

Steps marked **▶ YOU** are things only you can do (accounts, keys, DNS).
Steps marked **⚙ APP** are wired in the code.

---

## 1. Supabase — database + Google login

### ▶ YOU — create the schema
1. Open your project at https://app.supabase.com → the project whose URL is in your env
   (`https://ipcxdotvjfudtohzpnmy.supabase.co`).
2. **SQL Editor → New query** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates plans, profiles, jobs, applications, subscriptions, payments + RLS.
3. **Storage → New bucket** → name it `cvs` → Private.

### ▶ YOU — turn on Google login
1. **Authentication → Providers → Google → Enable.**
2. It shows a **Callback URL** like
   `https://ipcxdotvjfudtohzpnmy.supabase.co/auth/v1/callback`. Copy it.
3. Go to https://console.cloud.google.com → **APIs & Services → Credentials → Create
   OAuth client ID → Web application**.
   - Authorized redirect URIs: paste the Supabase callback URL above **and**
     `https://YOUR-DOMAIN/api/google/callback` (for the Gmail-send connect).
   - **Enable the Gmail API** (APIs & Services → Library → Gmail API → Enable).
   - On the OAuth consent screen, add scopes: `.../auth/userinfo.email`,
     `.../auth/userinfo.profile`, `.../auth/gmail.send`.
4. Copy the **Client ID** and **Client secret**.
5. Back in Supabase Google provider, paste the Client ID + secret → Save.

> Same Google client powers both **login** and **send email as the user**.

---

## 2. Paynow — payments

### ▶ YOU — merchant account
1. Sign up / log in at https://www.paynow.co.zw → **Create a merchant / "Receive money"**.
2. Open your integration → copy the **Integration ID** and **Integration Key**.
3. In the integration settings set:
   - **Return URL:** `https://YOUR-DOMAIN/billing/return`
   - **Result URL:** `https://YOUR-DOMAIN/api/billing/result`

### ⚙ APP
- [`src/lib/paynow.ts`](src/lib/paynow.ts) handles the initiate + poll + hash.
- [`src/lib/plans.ts`](src/lib/plans.ts) holds the tiers (Base $17 / Pro $25 / Premium $60).

---

## 3. Environment variables

Create `.env.local` (local) and add the same in **Vercel → Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://ipcxdotvjfudtohzpnmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=...            # server only — never NEXT_PUBLIC

GOOGLE_CLIENT_ID=...                      # the Web OAuth client
GOOGLE_CLIENT_SECRET=...

PAYNOW_INTEGRATION_ID=...
PAYNOW_INTEGRATION_KEY=...

APP_URL=https://YOUR-DOMAIN              # used to build return/result URLs
APPLY_ENCRYPTION_KEY=...                 # 32-byte hex for token/password encryption
CRON_SECRET=...                          # protects the auto-apply cron
```

Generate `APPLY_ENCRYPTION_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 4. Vercel — hosting + your domain

### ▶ YOU
1. Push this repo to GitHub.
2. https://vercel.com → **Add New → Project → import the repo.** Framework: Next.js (auto).
3. Add all env vars from section 3 → **Deploy.**
4. **Project → Settings → Domains → Add** your domain. Vercel shows DNS records:
   - Apex (`yourdomain.com`): an **A record → 76.76.21.21**, or follow Vercel's exact value.
   - `www`: a **CNAME → cname.vercel-dns.com**.
   Add these at your domain registrar. SSL is automatic once DNS propagates.
5. Update Google + Paynow redirect/return URLs to use the final domain.

### Keeping jobs fresh
The scraper (`npm run scrape`) writes to Supabase via the service role. Run it on a
schedule with a **GitHub Action** (cron) or any small box — see `scripts/scrape`.

---

## 5. Remaining engineering (the migration) — tracked

The app currently uses a local file store; production swaps it for Supabase. Phases:
- [ ] Auth: Google login screen + session middleware + protect app routes
- [ ] Data layer: read/write profiles, jobs, applications, send-creds from Supabase
- [ ] Billing: `/billing` page + `/api/billing/checkout` + `/api/billing/result` → activate subscription, set `plan_id`
- [ ] Gate auto-apply daily cap by the user's active plan
- [ ] Scraper → Supabase `jobs` upsert; GitHub Action cron

Do these after the accounts in 1–2 exist, so each phase is testable against real services.
