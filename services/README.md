# Services

## ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT

All services in this directory **MUST** comply with the following:

1. **GPT MAY ONLY** discover candidate companies (name, domain candidates, social profiles, directory entries) using search tools.
2. **GPT MUST NOT** output issues, evidence excerpts, or verified contact details.
3. **All claimed facts** shown to users must be verified by backend via actual network fetches (HTTP/DNS) or trustworthy directory APIs, and stored as snapshots.
4. **Any textual evidence** used in UI must be an exact substring of a stored snapshot. **NO EXCEPTIONS.**

---

📖 **Full documentation:** [`src/docs/architecture.md`](../src/docs/architecture.md)

📦 **Type definitions:** [`src/types/pipeline.ts`](../src/types/pipeline.ts)
