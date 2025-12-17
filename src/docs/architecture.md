# Lead Intel Architecture

## Pipeline Overview

```
Discovery → Verification/Fetch → Analysis
```

### 1. Discovery (AI-Assisted)
GPT uses search tools to find **candidate** companies:
- Company names
- Domain candidates
- Social profiles
- Directory entries

### 2. Verification/Fetch (Backend Only)
Backend verifies all claims via:
- HTTP/DNS network fetches
- Trustworthy directory API queries
- Results stored as **snapshots**

### 3. Analysis (Snapshot-Based)
All analysis operates on verified snapshots only.

---

## Immutable Rule: NO AI-CLAIMS WITHOUT SNAPSHOT

```
┌─────────────────────────────────────────────────────────────────────────┐
│ IMMUTABLE RULE                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. GPT MAY ONLY discover candidate companies (name, domain candidates, │
│    social profiles, directory entries) using a search tool.            │
│                                                                         │
│ 2. GPT MUST NOT output issues, evidence excerpts, or verified contact  │
│    details.                                                             │
│                                                                         │
│ 3. All claimed facts shown to users MUST be verified by backend via    │
│    actual network fetches (HTTP/DNS) or trustworthy directory APIs,    │
│    and stored as snapshots.                                             │
│                                                                         │
│ 4. Any textual evidence used in UI MUST be an exact substring of a     │
│    stored snapshot. NO EXCEPTIONS.                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

See `src/types/pipeline.ts` for:
- `Candidate` - Discovered company candidate from AI search
- `Snapshot` - Verified network fetch result
- `VerifiedResource` - Resource validated against snapshot
- `DiscoveryResult` - AI search output
- `AnalysisInput` - Snapshot-based analysis input

---

## Enforcement

- All services in `services/` must comply with this rule
- Runtime code must never surface AI-generated claims directly
- UI must only display data traceable to a stored snapshot
