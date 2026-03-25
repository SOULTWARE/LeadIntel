# Lead Intel Pro · V1.0 Beta

Lead Intel Pro turns raw location-based business data into verified, enriched lead lists that are ready for outreach. V1.Beta focuses on dependable sourcing, AI scoring, and contact discovery while keeping the deployment footprint lean.

---

## Contents

1. [Product Overview](#product-overview)
2. [Core Capabilities](#core-capabilities)
3. [System Architecture](#system-architecture)
4. [Requirements](#requirements)
5. [Environment Variables](#environment-variables)
6. [Setup & Local Development](#setup--local-development)
7. [Operational Workflows](#operational-workflows)
8. [Tech Stack](#tech-stack)

---

## Product Overview

- **Audience**: GTM and growth teams that need pre-qualified SMB leads with contextual insight.
- **Goal**: Source, enrich, and save leads with deterministic signals before handing them to SDRs.
- **Version Scope**: V1.Beta covers the `/sourcer` experience, AI compatibility analysis, Supabase-authenticated persistence, and CSV-ready exports.

## Core Capabilities

| Pillar | Description |
| --- | --- |
| Verified Data Sourcing | Licensed SerpApi feeds + public records to capture business metadata (name, address, coordinates, ratings). |
| AI Compatibility Analysis | Batched OpenAI calls score each lead, produce hooks/problems, and normalize recommendation levels (`Highly Recommended` → `Not Recommended`). |
| Contact Discovery | Hybrid Hunter + Playwright crawler retrieves and verifies inboxes via Kickbox scoring. |
| Sessionized Saving | Leads persist to PostgreSQL via Prisma and may be grouped by named sessions for later review/export. |
| Credit Accounting | Each AI enhancement call holds and captures credits to keep workloads within quota. |
| Payments & Billing | Polar.sh handles checkout, subscriptions, plan upgrades/downgrades, and customer portal via `@polar-sh/nextjs`. |

## System Architecture

```
Client (Next.js app)
  └── /sourcer UI → /api/sourcer → SerpApi & internal collectors
       └── Optional auto-enhance → /api/enhance/batch → aiEnhanceService → OpenAI
            └── Lead persistence → Prisma (@/db) → PostgreSQL
Background worker (scripts/worker.ts)
  └── Polls DB (Option B) for long-running contact discovery + Hunter/Kickbox validation
Auth layer via Supabase session cookies guarding API routes
```

## Requirements

- Node.js 18+
- PostgreSQL 14+
- Supabase project for auth (URL + anon key)
- SerpApi (or other configured search provider)
- OpenAI API key (model defaults to `gpt-4o`, override with `AI_MODEL`)
- Hunter + Kickbox API keys for email discovery/verification
- Playwright browser dependencies (headless discovery)

## Environment Variables

Duplicate `.env.example` and fill the following groups:

| Group | Keys |
| --- | --- |
| Database | `DATABASE_URL` |
| AI | `OPENAI_API_KEY`, `AI_MODEL`, `MIN_CONFIDENCE_THRESHOLD` |
| Search | `SEARCH_PROVIDER`, `SEARCH_API_KEY`, `MAX_CONCURRENT_FETCHES`, `FETCH_USER_AGENT` |
| Emails | `HUNTER_API_KEY`, `KICKBOX_API_KEY` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Polar | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`, `POLAR_STARTER_PRODUCT_ID`, `POLAR_PRO_PRODUCT_ID`, `POLAR_ADDON_PRODUCT_ID`, `POLAR_SUCCESS_URL`, `POLAR_PORTAL_RETURN_URL` |

> Keep `.env` out of version control. Rotate keys whenever deploying a new beta build.

## Setup & Local Development

```bash
npm install
npx playwright install          # required for discovery flows
npm run db:push                 # sync Prisma schema to Postgres
npm run dev                     # start Next.js + API routes
npm run worker                  # optional: start background discoverer (Option B)
npm run start                   # production mode: starts Next.js + worker together
```

Additional scripts live in `package.json` (`npm run db:migrate`, `npm run test`).

## Operational Workflows

1. **Source** (`/sourcer` → `POST /api/sourcer`)
   - Define categories, geo targets, and batch size.
   - Collector stores the last request under `sourcerState.v1` to resume later.

2. **Enhance** (`POST /api/enhance/batch`)
   - Select leads + add a "Contact Purpose".
   - Service enforces Idempotency-Key headers, credit holds, and persists AI output back into `lead.aiAnalysis`.

3. **Save & Organize** (`POST /api/leads/save`)
   - Persist leads (optionally grouped via `sessionName`).
   - Upserts by `placeId` to avoid dupes; stores AI analysis fields alongside user metadata.

4. **Contact Discovery (worker)**
   - Background worker polls DB for pending leads, crawls websites via Playwright, looks up emails via Hunter, and verifies via Kickbox before writing verified contacts back to the session.

5. **Export & Review**
   - CSV export button on the results dashboard compiles saved leads with compatibility scores for downstream tooling.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, Prisma 7 + `@prisma/adapter-pg`, Supabase auth
- **Data & Intelligence**: Postgres, SerpApi, OpenAI (`aiEnhanceService`), Hunter, Kickbox
- **Tooling**: TypeScript 5, Playwright, Vitest
- **Payments**: Polar.sh (`@polar-sh/sdk`, `@polar-sh/nextjs`)

---

**Status**: V1.Beta — stable for internal teams, not yet hardened for multi-tenant production. Report issues via GitHub or the internal ops channel.
