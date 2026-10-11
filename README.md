# JobHunt Hub

A calm job-search dashboard: see jobs from LinkedIn, Naukri, Glassdoor and company career pages in one list,
spot roles that exist **only on a company's own careers page**, send your resume from your own Gmail with one
reviewed click, track every application and prepare for each interview.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui-style components, Prisma 7 on
PostgreSQL (Supabase), Better Auth, Inngest, Postmark and the Vercel AI SDK.

## Features

| Area | What it does |
|---|---|
| Jobs | Search with work mode chips, multi-city location picker (aliases, Delhi NCR, radius), company type, remote scope, experience, date posted, source, salary and "Career page only". Filters live in the URL. Saved searches with daily alerts. Two-pane view on desktop, full-page detail on phones, Up/Down keyboard navigation. |
| Career-page checker | Finds a company's careers page, detects Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee, Workable and Workday boards and calls their public endpoints. Otherwise reads `JobPosting` JSON-LD, then job links in the HTML, then (optionally) an LLM. Client-rendered pages are marked "Check manually". Respects `robots.txt`, 1 request/second per domain, 12-hour cache. |
| Compare and flag | Fuzzy title + location matching marks each role `CAREER_PAGE_ONLY`, `BOTH` or `PLATFORM_ONLY`. |
| Company type | SaaS / Product / Services / Manufacturing / Other, by website rules first, then LLM at confidence ≥ 0.7. Users can correct a type for their own view; once 3 people agree, it becomes the shared value. |
| Alert intake | Each user gets a private forwarding address. Postmark posts forwarded alert emails to `/api/inbound/email`; parsers for LinkedIn, Naukri and Glassdoor turn them into jobs. Raw emails are deleted after 7 days. |
| Apply | Apply link with copy-ready answers and resume download, or an editable email draft sent through Gmail (`gmail.send` scope only). Max 20 emails a day, one per company per role. Every send is an explicit click. |
| Tracker | Board (drag and drop, plus a "Move to" menu) on desktop, grouped list on phones. Follow-up reminders. |
| Interview prep | Created when an application moves to Interview: role summary, skills gap with study list, likely questions (regenerate with a focus), company notes, checklist, round notes, reminders 1 day and 1 hour before. Works without an LLM using templates. |
| Privacy | No platform passwords or cookies, OAuth tokens encrypted at rest, private resume bucket with signed URLs, "Delete my data". |

## Getting started

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # fill in the values you have
npm run db:deploy           # apply migrations (uses DIRECT_URL)
npm run db:seed             # optional demo companies and jobs
npm run dev
```

Inngest runs the background work (daily career-page checks, alert parsing, reminders). In development start the
local dev server alongside the app:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Without Inngest the app still works: alert emails and company checks run inline.

### What each key unlocks

| Variables | Needed for |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Everything |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Sign-in sessions |
| `LINKEDIN_CLIENT_*`, `GOOGLE_CLIENT_*` | Sign in with LinkedIn / Google; Google also connects Gmail for sending |
| `SUPABASE_*` | Resume upload (create a **private** bucket named by `SUPABASE_RESUME_BUCKET`) |
| `POSTMARK_*`, `INBOUND_EMAIL_DOMAIN` | Alert forwarding and notification emails. Point the inbound webhook at `https://<app>/api/inbound/email?token=<POSTMARK_INBOUND_SECRET>` |
| `INNGEST_*` | Background jobs in production |
| `LLM_API_KEY` (+ optional `LLM_BASE_URL`, `LLM_MODEL`) | Cover notes, career-page extraction, company classification fallback, interview questions. Any OpenAI-compatible endpoint works. |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Error reporting |
| `JOBS_DATA_API_*` | Optional licensed jobs feed |

### OAuth setup notes

- **LinkedIn**: create an app with "Sign In with LinkedIn using OpenID Connect"; redirect URL `https://<app>/api/auth/callback/linkedin`.
- **Google**: redirect URL `https://<app>/api/auth/callback/google`. Add the `gmail.send` scope to the consent screen. It is a
  sensitive scope, so a public launch needs Google's app verification; until then only test users can connect Gmail.
  Start verification early.

## Deploying

The app is built for **Vercel** (hosting), **Supabase** (Postgres + resume storage), **Inngest** (background jobs)
and **Postmark** (inbound alert emails and notifications). Every push to `main` deploys; pull requests get preview URLs.

1. **Supabase**: create a project. Copy the pooled connection string to `DATABASE_URL` and the direct one to
   `DIRECT_URL`. In Storage, create a **private** bucket called `resumes`. Copy the project URL and service-role key.
2. **Vercel**: import the GitHub repository (framework is detected as Next.js). Add every variable from
   `.env.example` under Project → Settings → Environment Variables, with `BETTER_AUTH_URL` and
   `NEXT_PUBLIC_APP_URL` set to the production domain. The `vercel-build` script generates the Prisma client, applies
   pending migrations and builds, so the database schema is always in step with the code.
3. **Sign-in providers**: add `https://<domain>/api/auth/callback/google` and `.../linkedin` as redirect URLs in the
   Google Cloud and LinkedIn developer consoles. Submit the Google app for verification (needed for `gmail.send`).
4. **Inngest**: install the Inngest integration from the Vercel marketplace. It sets `INNGEST_EVENT_KEY` and
   `INNGEST_SIGNING_KEY` and syncs `/api/inngest` on every deploy, which turns on the daily career-page checks,
   alert parsing and reminders.
5. **Postmark**: verify a sender address for notifications (`POSTMARK_FROM_ADDRESS`). For alerts, point an MX record
   for `INBOUND_EMAIL_DOMAIN` (for example `in.yourapp.com`) at Postmark's inbound server and set the inbound webhook to
   `https://<domain>/api/inbound/email?token=<POSTMARK_INBOUND_SECRET>`.
6. Optional: `LLM_API_KEY` for AI drafting and `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` for error reports.

Career-page checks call other companies' sites, so the server needs normal outbound internet access (Vercel has it).

## Scripts

| Command | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint, TypeScript |
| `npm test` | Vitest unit tests (parsers, adapters, matching, filters, flagging) |
| `npm run test:e2e` | Playwright. With a database, `BETTER_AUTH_SECRET` and `E2E_SEED=1` it seeds a test user and runs the signed-in flows too (CI does this). `PW_CHROMIUM_PATH` points at a preinstalled Chromium |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma |

## Project layout

```
app/                 routes: landing, sign-in, onboarding, (app)/jobs, companies, applications, settings, api/*
app/actions/         server actions (save, move, correct type, settings)
components/          ui/ (shadcn-style primitives), jobs/, apply/, companies/, applications/, prep/, settings/, shell/
lib/ats/             job board adapters + detection + generic fallback
lib/companies/       resolve careers page, classify type, check and flag
lib/email/           Gmail send, Postmark, alert parsers
lib/matching/        cities, normalisation, work mode, dedupe, filters, URL query
lib/prep/            skills gap, questions, company notes
lib/providers/       JobProvider interface and providers (alerts, manual, career page, aggregator)
inngest/             background functions
prisma/              schema, migrations, seed
tests/               unit (Vitest) and e2e (Playwright)
```

## Notes and limits

- None of LinkedIn, Naukri or Glassdoor offers a public jobs API. The app never logs in to them, scrapes them or
  auto-applies. Platform jobs arrive through the alert emails you forward; "Apply" opens the platform's own page.
- Alert email formats change without notice. The parsers are tested against sample emails in `tests/fixtures`;
  add real samples there when a format changes.
- Career pages rendered entirely in the browser (and Darwinbox, Keka, Zoho Recruit) show "Check manually" for now.
- The Workday adapter follows Workday's public career-site endpoint but was tested only against sample responses;
  check it with one real Workday company before relying on it.

The product brief and design guide are in `docs/`.
