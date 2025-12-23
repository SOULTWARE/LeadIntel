# Lead Intel Pro ✨

High-precision lead generation via Google Maps scraping, AI compatibility enhancement, and automated contact discovery.

## Features

- **Google Maps Scraper**: Extract rich business data (name, address, website, rating) with deep precision using SerpApi.
- **AI Enhancement**: Automatically verify if a business needs your services using OpenAI's latest models.
- **Batch Contact Discovery**: Deep-scout emails for dozens of leads at once. Uses a hybrid engine of Playwright website scraping and AI-driven search fallbacks.
- **Clean Results Dashboard**: A refined UI focusing on business value (Company, Analysis, Score) while unifying contact details in an interactive lead drawer.
- **Intelligent Filtering**: Narrow down leads by AI recommendation level to focus on "Highly Recommended" opportunities.
- **CSV Export**: Download professionally formatted lead lists with full intelligence results.

## Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- SerpApi Key (for Google Maps scraping)
- OpenAI API Key (for AI enhancement)
- **Playwright** (for contact discovery)

### 2. Environment Setup
Create a `.env` file based on `.env.example`:
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
SEARCH_API_KEY="serpapi_key_..."
AI_MODEL="gpt-4o"
```

### 3. Installation
```bash
npm install
npx playwright install
npm run db:push
npm run dev
```

## Workflow

1. **Scrape**: Navigate to `/scraper`, enter your target categories and locations.
2. **Analyze**: Provide a "Contact Purpose" to trigger AI verification and scoring.
3. **Discover**: Select leads in the results table and click **Find Emails** to automatically scout contact info.
4. **Capture**: Access deep insights in the lead drawer or export your qualified list to CSV.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM (PostgreSQL)
- **Intelligence**: OpenAI GPT-5-Nano / GPT-4o
- **Scraping**: SerpApi (Google Maps Engine)
- **Discovery**: Playwright (Headless Browser Automation) & AI Search
