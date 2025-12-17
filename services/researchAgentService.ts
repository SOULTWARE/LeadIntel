/**
 * AI-Guided Research Agent Service
 *
 * An autonomous research agent that:
 * 1. Analyzes available data and identifies what's missing
 * 2. Uses AI to formulate targeted search queries
 * 3. Executes real web searches via SerpAPI
 * 4. Analyzes results and extracts verified facts
 * 5. Iterates until sufficient data is found or max iterations reached
 *
 * CRITICAL: Never invents data. All facts must come from search results.
 */

import { OpenAIClient } from "./ai/openaiClient";

const SERP_API_KEY = process.env.SEARCH_API_KEY || process.env.SERP_API_KEY;
const MAX_RESEARCH_ITERATIONS = 3;
const MAX_SEARCHES_PER_ITERATION = 2;

interface ResearchContext {
  companyName: string;
  domain?: string;
  leadPurpose: string;
  existingData: {
    industry?: string | null;
    location?: string | null;
    employeeCount?: number | null;
    description?: string | null;
    decisionMakers?: Array<{ name: string; title?: string }>;
    issues?: Array<{ title: string; description: string }>;
  };
  websiteContent?: string;
}

interface SearchResult {
  query: string;
  source: string;
  url: string;
  snippet: string;
  title: string;
}

interface ExtractedFact {
  field: string;
  value: string | number;
  source: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

interface ResearchResult {
  industry?: string;
  location?: string;
  employeeCount?: number;
  description?: string;
  decisionMakers: Array<{
    firstName: string;
    lastName: string;
    title?: string;
    source: string;
    evidence: string;
  }>;
  issues: Array<{
    title: string;
    description: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    evidence: string;
    source: string;
  }>;
  searchesPerformed: Array<{ query: string; resultsCount: number }>;
  iterationsUsed: number;
}

interface SerpAPIResponse {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet?: string;
    displayed_link?: string;
  }>;
  knowledge_graph?: {
    title?: string;
    description?: string;
    type?: string;
    headquarters?: string;
    founded?: string;
    employees?: string;
  };
  local_results?: {
    places?: Array<{
      title?: string;
      address?: string;
      phone?: string;
    }>;
  };
}

export class ResearchAgentService {
  private aiClient: OpenAIClient;

  constructor() {
    this.aiClient = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.AI_MODEL || "gpt-4o",
    });
  }

  /**
   * Main research loop - AI analyzes gaps and directs searches
   */
  async research(context: ResearchContext): Promise<ResearchResult> {
    const result: ResearchResult = {
      decisionMakers: [],
      issues: [],
      searchesPerformed: [],
      iterationsUsed: 0,
    };

    if (!SERP_API_KEY) {
      console.log("[ResearchAgent] No SERP API key, skipping research");
      return result;
    }

    let allSearchResults: SearchResult[] = [];

    for (let iteration = 0; iteration < MAX_RESEARCH_ITERATIONS; iteration++) {
      result.iterationsUsed = iteration + 1;
      console.log(`[ResearchAgent] Iteration ${iteration + 1}/${MAX_RESEARCH_ITERATIONS}`);

      // Step 1: AI analyzes what data is missing and what to search for
      const searchPlan = await this.planSearches(context, result, allSearchResults);

      if (searchPlan.complete) {
        console.log("[ResearchAgent] AI determined research is complete");
        break;
      }

      if (searchPlan.queries.length === 0) {
        console.log("[ResearchAgent] No more searches to perform");
        break;
      }

      // Step 2: Execute the searches
      for (const query of searchPlan.queries.slice(0, MAX_SEARCHES_PER_ITERATION)) {
        console.log(`[ResearchAgent] Searching: "${query}"`);
        const searchResults = await this.executeSearch(query);
        result.searchesPerformed.push({ query, resultsCount: searchResults.length });
        allSearchResults.push(...searchResults);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Step 3: AI extracts facts from search results
      const extractedFacts = await this.extractFacts(context, allSearchResults);

      // Step 4: Update result with extracted facts
      this.applyExtractedFacts(result, extractedFacts);

      // Update context with new data for next iteration
      context.existingData = {
        ...context.existingData,
        industry: result.industry || context.existingData.industry,
        location: result.location || context.existingData.location,
        employeeCount: result.employeeCount || context.existingData.employeeCount,
        description: result.description || context.existingData.description,
      };
    }

    // Final step: AI identifies issues based on leadPurpose
    if (result.issues.length === 0) {
      const issues = await this.identifyIssues(context, allSearchResults);
      result.issues = issues;
    }

    return result;
  }

  /**
   * AI plans what searches to perform based on gaps in data
   */
  private async planSearches(
    context: ResearchContext,
    currentResult: ResearchResult,
    previousSearchResults: SearchResult[]
  ): Promise<{ complete: boolean; queries: string[] }> {
    const prompt = `You are a research planner. Analyze what data we have and what's missing.

COMPANY: ${context.companyName}
DOMAIN: ${context.domain || "unknown"}
LEAD PURPOSE: "${context.leadPurpose}"

CURRENT DATA:
- Industry: ${context.existingData.industry || currentResult.industry || "MISSING"}
- Location: ${context.existingData.location || currentResult.location || "MISSING"}
- Employee Count: ${context.existingData.employeeCount || currentResult.employeeCount || "MISSING"}
- Description: ${context.existingData.description || currentResult.description || "MISSING"}
- Decision Makers Found: ${currentResult.decisionMakers.length}
- Issues Found: ${currentResult.issues.length}

PREVIOUS SEARCHES (${previousSearchResults.length} results total):
${previousSearchResults.slice(-10).map(r => `- "${r.query}" -> ${r.title}`).join('\n') || "None yet"}

Based on the lead purpose "${context.leadPurpose}", determine:
1. Is the research complete enough to analyze this lead? (need basic company info + potential issues)
2. If not, what specific searches would help find the missing data?

Focus searches on:
- Finding company size/employee count (for budget estimation)
- Finding location details
- Finding owner/CEO/decision maker names
- Finding problems or pain points related to "${context.leadPurpose}"

Return JSON only:
{
  "complete": boolean,
  "reasoning": "brief explanation",
  "queries": ["search query 1", "search query 2"] // max 2 queries, empty if complete
}`;

    try {
      const response = await this.aiClient.complete({
        messages: [{ role: "user", content: prompt }],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      console.log(`[ResearchAgent] Plan: ${parsed.reasoning}`);
      return {
        complete: parsed.complete === true,
        queries: Array.isArray(parsed.queries) ? parsed.queries : [],
      };
    } catch (error) {
      console.error("[ResearchAgent] Planning failed:", error);
      return { complete: false, queries: [] };
    }
  }

  /**
   * Execute a search query via SerpAPI
   */
  private async executeSearch(query: string): Promise<SearchResult[]> {
    if (!SERP_API_KEY) return [];

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", SERP_API_KEY);
      url.searchParams.set("num", "5");

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error("[ResearchAgent] SerpAPI error:", response.status);
        return [];
      }

      const data: SerpAPIResponse = await response.json();
      const results: SearchResult[] = [];

      // Extract from organic results
      if (data.organic_results) {
        for (const item of data.organic_results.slice(0, 5)) {
          if (item.snippet) {
            results.push({
              query,
              source: item.displayed_link || new URL(item.link).hostname,
              url: item.link,
              snippet: item.snippet,
              title: item.title,
            });
          }
        }
      }

      // Extract from knowledge graph if available
      if (data.knowledge_graph) {
        const kg = data.knowledge_graph;
        if (kg.description || kg.headquarters || kg.employees) {
          results.push({
            query,
            source: "Google Knowledge Graph",
            url: "",
            snippet: [
              kg.description,
              kg.headquarters ? `Headquarters: ${kg.headquarters}` : "",
              kg.employees ? `Employees: ${kg.employees}` : "",
              kg.founded ? `Founded: ${kg.founded}` : "",
            ].filter(Boolean).join(". "),
            title: kg.title || "",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("[ResearchAgent] Search failed:", error);
      return [];
    }
  }

  /**
   * AI extracts verified facts from search results
   */
  private async extractFacts(
    context: ResearchContext,
    searchResults: SearchResult[]
  ): Promise<ExtractedFact[]> {
    if (searchResults.length === 0) return [];

    const snippetsText = searchResults
      .map((r, i) => `[${i + 1}] Source: ${r.source}\nURL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.snippet}`)
      .join("\n\n");

    const prompt = `You are a fact extractor. Extract ONLY verified facts from these search results about "${context.companyName}".

SEARCH RESULTS:
${snippetsText}

RULES:
1. Only extract facts that are EXPLICITLY stated in the snippets
2. Do NOT invent or assume any information
3. Include the source and exact evidence quote for each fact
4. Mark confidence: "high" if directly stated, "medium" if strongly implied, "low" if uncertain

Extract these fields if found:
- industry: What industry/sector the company operates in
- location: City, state, or address
- employeeCount: Number of employees (as a number)
- description: Brief company description
- decisionMakers: Names and titles of owners, CEOs, managers (as array)

Return JSON only:
{
  "facts": [
    {
      "field": "industry|location|employeeCount|description|decisionMaker",
      "value": "extracted value",
      "source": "source name",
      "evidence": "exact quote from snippet",
      "confidence": "high|medium|low"
    }
  ]
}

Return empty facts array if nothing can be verified.`;

    try {
      const response = await this.aiClient.complete({
        messages: [{ role: "user", content: prompt }],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed.facts) ? parsed.facts : [];
    } catch (error) {
      console.error("[ResearchAgent] Fact extraction failed:", error);
      return [];
    }
  }

  /**
   * Apply extracted facts to the result
   */
  private applyExtractedFacts(result: ResearchResult, facts: ExtractedFact[]): void {
    for (const fact of facts) {
      // Only apply high/medium confidence facts
      if (fact.confidence === "low") continue;

      switch (fact.field) {
        case "industry":
          if (!result.industry && typeof fact.value === "string") {
            result.industry = fact.value;
          }
          break;
        case "location":
          if (!result.location && typeof fact.value === "string") {
            result.location = fact.value;
          }
          break;
        case "employeeCount":
          if (!result.employeeCount) {
            const num = typeof fact.value === "number" ? fact.value : parseInt(String(fact.value));
            if (!isNaN(num)) result.employeeCount = num;
          }
          break;
        case "description":
          if (!result.description && typeof fact.value === "string") {
            result.description = fact.value;
          }
          break;
        case "decisionMaker":
          if (typeof fact.value === "string") {
            const nameParts = fact.value.split(/\s+/);
            if (nameParts.length >= 2) {
              // Check if already exists
              const exists = result.decisionMakers.some(
                dm => dm.firstName === nameParts[0] && dm.lastName === nameParts.slice(1).join(" ")
              );
              if (!exists) {
                result.decisionMakers.push({
                  firstName: nameParts[0],
                  lastName: nameParts.slice(1).join(" "),
                  title: fact.evidence.match(/(?:CEO|Owner|Founder|President|Director|Manager|Partner)/i)?.[0],
                  source: fact.source,
                  evidence: fact.evidence,
                });
              }
            }
          }
          break;
      }
    }
  }

  /**
   * AI identifies issues/problems based on lead purpose
   * CRITICAL: Only creates issues with REAL verifiable evidence from search results
   */
  private async identifyIssues(
    context: ResearchContext,
    searchResults: SearchResult[]
  ): Promise<ResearchResult["issues"]> {
    // Only use search results that have actual content
    const resultsWithContent = searchResults.filter(r => r.snippet && r.snippet.length > 20);

    if (resultsWithContent.length === 0 && !context.websiteContent) {
      console.log("[ResearchAgent] No search results with content - cannot identify issues without evidence");
      return [];
    }

    const snippetsText = resultsWithContent
      .slice(-15)
      .map((r, i) => `[${i + 1}] Source: ${r.source}\nURL: ${r.url}\nSnippet: "${r.snippet}"`)
      .join("\n\n");

    const websiteContext = context.websiteContent
      ? `\nWEBSITE CONTENT (from their actual website):\n"${context.websiteContent.slice(0, 3000)}"`
      : "";

    const prompt = `You are a strict fact-checker. Identify ONLY issues that have DIRECT EVIDENCE in the provided data.

COMPANY: "${context.companyName}"
LEAD PURPOSE: "${context.leadPurpose}"

AVAILABLE EVIDENCE:
${websiteContext}

SEARCH RESULTS:
${snippetsText || "None"}

STRICT RULES - READ CAREFULLY:
1. You can ONLY identify issues if you can quote EXACT TEXT from the evidence above
2. The "evidence" field MUST be a DIRECT QUOTE from the website content or search snippets
3. Do NOT create generic issues like "need stronger online presence" without specific evidence
4. Do NOT invent or assume problems - if you can't find clear evidence, return empty array
5. Each issue MUST have a real quote that proves the problem exists

For website-related leads, look for SPECIFIC evidence like:
- Broken features mentioned in reviews
- Specific usability complaints in feedback
- Actual quotes about website problems
- Missing functionality mentioned in the website itself

Return JSON only:
{
  "issues": [
    {
      "title": "Specific issue title",
      "description": "Why this matters for their business",
      "category": "website|marketing|operations|technology|other",
      "severity": "low|medium|high|critical",
      "evidence": "EXACT QUOTE from the data above that proves this issue",
      "source": "URL or source where the quote came from"
    }
  ]
}

If you cannot find SPECIFIC EVIDENCE for any issues, return: {"issues": []}
Do NOT make up evidence. Do NOT create generic issues without quotes.`;

    try {
      const response = await this.aiClient.complete({
        messages: [{ role: "user", content: prompt }],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

      // Filter out issues without real evidence
      const validIssues = issues.filter((issue: { evidence?: string; source?: string }) => {
        // Must have non-empty evidence that's not generic
        if (!issue.evidence || issue.evidence.length < 10) return false;
        // Evidence shouldn't be generic phrases
        const genericPhrases = ["online presence", "digital era", "modern business", "potential customers"];
        const isGeneric = genericPhrases.some(phrase =>
          issue.evidence?.toLowerCase().includes(phrase) && issue.evidence?.length < 100
        );
        return !isGeneric;
      });

      console.log(`[ResearchAgent] Identified ${validIssues.length} issues with real evidence (filtered from ${issues.length})`);
      return validIssues;
    } catch (error) {
      console.error("[ResearchAgent] Issue identification failed:", error);
      return [];
    }
  }
}
