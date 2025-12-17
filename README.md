This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Lead Intel - AI-Powered Lead Generation Pipeline

Lead Intel is an intelligent lead generation system that discovers, verifies, and analyzes business leads using AI and web scraping.

### Pipeline Overview

1. **Discovery** - GPT + web search finds candidate companies
2. **Verification/Fetch** - Backend fetches and stores webpage snapshots
3. **Analysis** - AI analyzes snapshots to generate qualified leads

⚠️ **Immutable Rule**: GPT only discovers candidates via search. All claims must be verified against stored snapshots.

## Setup & Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for GPT |
| `SEARCH_PROVIDER` | Search provider: `openai` (default) |
| `SEARCH_API_KEY` | API key for search provider (uses OPENAI_API_KEY if not set) |

Optional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MODEL` | `gpt-4o` | OpenAI model to use |
| `MAX_CONCURRENT_FETCHES` | `10` | Max parallel fetch operations |
| `FETCH_USER_AGENT` | `LeadIntel/1.0` | User agent for web requests |
| `MIN_CONFIDENCE_THRESHOLD` | `60` | Minimum confidence for auto-approval |

### 2. Database Setup

Run Prisma migrations to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# Run migrations (production)
npx prisma migrate deploy
```

### 3. Running Tests

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test

# Run specific test file
pnpm test:run tests/e2e-pipeline.test.ts
```

### 4. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads/generate` | POST | Generate leads (full pipeline) |
| `/api/snapshots/[id]` | GET | Get snapshot content |
| `/api/snapshots/[id]/verify` | POST | Verify/correct evidence |
| `/api/ops/metrics` | GET | Operational metrics (⚠️ no auth in MVP) |

### 5. Monitoring

Access metrics at `/api/ops/metrics`:

```bash
curl http://localhost:3000/api/ops/metrics
```

Returns discovery requests, fetch errors, verification failures, and leads saved.

⚠️ **Warning**: The metrics endpoint has no authentication in MVP. Add auth before production deployment.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
