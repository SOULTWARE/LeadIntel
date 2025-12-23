# Lead Intel Pro ✨

High-precision lead generation via Google Maps scraping & AI compatibility enhancement.

## Features

- **Google Maps Scraper**: Extract rich business data (name, address, website, rating) with deep precision using SerpApi.
- **AI Enhancement**: Automatically verify if a business needs your services using GPT-4o analysis.
- **Results Management**: Save verified leads to a persistent database or export them directly to CSV.
- **Modern UI**: A premium, responsive dashboard built with Next.js and Tailwind CSS.

## Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- SerpApi Key (for Google Maps scraping)
- OpenAI API Key (for AI enhancement)

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
npm run db:push
npm run dev
```

## Workflow

1. **Scrape**: Navigate to `/scraper`, enter your target categories and locations.
2. **Analyze**: Provide a "Contact Purpose" and click "AI Enhance" to see which businesses are the best fit.
3. **Capture**: Export your qualified leads to CSV or save them to your dashboard for outreach.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Intelligence**: OpenAI GPT-5-Nano
- **Scraping**: SerpApi (Google Maps Engine)
