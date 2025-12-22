# Lead Page UI Guidelines

## User Goals

### Primary Goal (< 10 seconds)
Answer two questions immediately:
1. **"Should I contact this lead and why?"** — Show actionability status and primary opportunity
2. **"What exactly to say?"** — Surface the best email draft or talking points

### Secondary Goal
Provide audit evidence behind AI-generated insights for transparency and verification.

## UI Rules

### Key Opportunities
- Display **max 3-4 Key Opportunities** prominently
- Each opportunity should be a concise, actionable statement
- Prioritize by relevance to `leadPurpose`

### Review Badge
Show **"Needs manual review"** badge when:
- `confidenceScore < 70`
- `requiresReview === true`

### Audit Log
- Hide raw AI JSON (`aiRawOutput`) behind an expandable **"Audit Log"** section
- Include deep search signals, score breakdowns, and search provenance
- This is for power users and debugging, not primary UX

### Actionability Indicators
- `actionable: true` → Green checkmark, lead is ready for outreach
- `actionable: false` → Gray/muted, needs more research or is low quality
- `actionabilityScore` (0-100) → Progress bar or score badge
- `primaryOpportunity` → One-liner displayed prominently at top of lead card

## Data Model Reference

| Field | Type | Purpose |
|-------|------|---------|
| `actionable` | Boolean | Quick yes/no for "should I contact?" |
| `actionabilityScore` | Int (0-100) | Granular score for prioritization |
| `primaryOpportunity` | String | Human-readable one-liner hook |
| `requiresReview` | Boolean | Flags leads needing manual verification |
| `confidenceScore` | Float | AI confidence in data accuracy |
