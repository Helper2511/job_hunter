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
| Career-page checker | Finds a company's careers page, detects Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee and Workable boards and calls their public endpoints. Otherwise reads `JobPosting` JSON-LD, then job links in the HTML, then (optionally) an LLM. Client-rendered pages are marked "Check manually". Respects `robots.txt`, 1 request/second per domain, 12-hour cache. |
| Compare and flag | Fuzzy title + location matching marks each role `CAREER_PAGE_ONLY`, `BOTH` or `PLATFORM_ONLY`. |
| Company type | SaaS / Product / Services / Manufacturing / Other, by website rules first, then LLM at confidence ≥ 0.7. Users can correct a type for their own view; corrections are stored for review. |
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

## Scripts

| Command | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint, TypeScript |
| `npm test` | Vitest unit tests (parsers, adapters, matching, filters, flagging) |
| `npm run test:e2e` | Playwright. Signed-in flows need `E2E_SESSION_COOKIE`; set `PW_CHROMIUM_PATH` to use a preinstalled Chromium |
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
- Career pages rendered entirely in the browser (and Workday, Darwinbox, Keka, Zoho Recruit) show "Check manually"
  for now.

The product brief and design guide are in `docs/`.
