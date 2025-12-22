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
const MAX_RESEARCH_ITERATIONS = 8;  // Deep search needs more iterations
const MAX_SEARCHES_PER_ITERATION = 4;  // More comprehensive searches

// Search categories for deep research
const SEARCH_CATEGORIES = {
  COMPANY_INFO: "company_info",        // Basic company details
  DECISION_MAKERS: "decision_makers",  // Owners, executives, contacts
  REVIEWS_REPUTATION: "reviews",       // Customer reviews, reputation signals
  NEWS_PRESS: "news",                  // News articles, press releases
  SOCIAL_PRESENCE: "social",           // Social media presence and activity
  PROBLEMS_OPPORTUNITIES: "problems",  // Pain points, challenges, opportunities
  COMPETITORS: "competitors",          // Competitive landscape
  FINANCIALS: "financials",            // Revenue, funding, growth signals
} as const;

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

interface DecisionMakerContact {
  type: "email" | "phone" | "linkedin" | "twitter" | "instagram" | "facebook" | "website";
  value: string;
  source: string;
  evidence: string;
}

// Signal collected from deep search
interface ResearchSignal {
  category: string;
  type: string;
  value: string;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceUrl: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
  relevanceToIntent: number; // 0-100 how relevant to lead purpose
}

interface ResearchResult {
  industry?: string;
  location?: string;
  employeeCount?: number;
  description?: string;
  founded?: string;
  revenue?: string;
  website?: string;

  // Deep search signals
  signals: ResearchSignal[];

  // Computed scores from signals
  scoreBreakdown: {
    reputationScore: number;      // From reviews, ratings
    onlinePresenceScore: number;  // From social, website quality
    growthSignalsScore: number;   // From news, hiring, expansion
    intentMatchScore: number;     // How well they match lead purpose
    accessibilityScore: number;   // How easy to reach decision makers
  };

  decisionMakers: Array<{
    firstName: string;
    lastName: string;
    title?: string;
    source: string;
    evidence: string;
    contacts: DecisionMakerContact[];
  }>;
  issues: Array<{
    title: string;
    description: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    evidence: string;
    source: string;
  }>;

  // Discovery information
  discoveryInfo: {
    searchesPerformed: Array<{ query: string; category: string; resultsCount: number }>;
    sourcesFound: string[];
    categoriesCovered: string[];
    totalSignalsCollected: number;
  };

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
   * Main research loop - AI analyzes gaps and directs deep searches
   */
  async research(context: ResearchContext): Promise<ResearchResult> {
    const result: ResearchResult = {
      decisionMakers: [],
      issues: [],
      signals: [],
      scoreBreakdown: {
        reputationScore: 0,
        onlinePresenceScore: 0,
        growthSignalsScore: 0,
        intentMatchScore: 0,
        accessibilityScore: 0,
      },
      discoveryInfo: {
        searchesPerformed: [],
        sourcesFound: [],
        categoriesCovered: [],
        totalSignalsCollected: 0,
      },
      searchesPerformed: [],
      iterationsUsed: 0,
    };

    if (!SERP_API_KEY) {
      console.log("[ResearchAgent] No SERP API key, skipping research");
      return result;
    }

    console.log(`[ResearchAgent] Starting DEEP SEARCH for: ${context.companyName}`);
    console.log(`[ResearchAgent] Lead Purpose: "${context.leadPurpose}"`);

    let allSearchResults: SearchResult[] = [];
    const categoriesSearched = new Set<string>();

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

      // Track categories being searched
      for (const cat of searchPlan.categories) {
        if (!result.discoveryInfo.categoriesCovered.includes(cat)) {
          result.discoveryInfo.categoriesCovered.push(cat);
        }
      }

      // Step 2: Execute the searches
      for (const query of searchPlan.queries.slice(0, MAX_SEARCHES_PER_ITERATION)) {
        console.log(`[ResearchAgent] Searching: "${query}"`);
        const searchResults = await this.executeSearch(query);
        result.searchesPerformed.push({ query, resultsCount: searchResults.length });

        // Track in discovery info
        const category = searchPlan.categories[0] || "general";
        result.discoveryInfo.searchesPerformed.push({
          query,
          category,
          resultsCount: searchResults.length
        });

        // Track unique sources
        for (const sr of searchResults) {
          if (sr.source && !result.discoveryInfo.sourcesFound.includes(sr.source)) {
            result.discoveryInfo.sourcesFound.push(sr.source);
          }
        }

        allSearchResults.push(...searchResults);

        // Delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: AI extracts facts AND signals from search results
      const extractedFacts = await this.extractFacts(context, allSearchResults);

      // Delay before signal extraction to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3b: Extract signals for scoring
      const signals = await this.extractSignals(context, allSearchResults.slice(-20));
      result.signals.push(...signals);
      result.discoveryInfo.totalSignalsCollected = result.signals.length;

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

    // Final step: AI identifies issues based on leadPurpose and collected signals
    if (result.issues.length === 0) {
      const issues = await this.identifyIssues(context, allSearchResults);
      result.issues = issues;
    }

    // Compute score breakdown from signals
    this.computeScoreBreakdown(result);

    console.log(`[ResearchAgent] Deep search complete:`);
    console.log(`  - Signals: ${result.signals.length}`);
    console.log(`  - Decision Makers: ${result.decisionMakers.length}`);
    console.log(`  - Issues: ${result.issues.length}`);
    console.log(`  - Categories: ${result.discoveryInfo.categoriesCovered.join(', ')}`);

    return result;
  }

  /**
   * Extract signals from search results for lead scoring
   */
  private async extractSignals(
    context: ResearchContext,
    searchResults: SearchResult[]
  ): Promise<ResearchSignal[]> {
    if (searchResults.length === 0) return [];

    const snippetsText = searchResults
      .map((r, i) => `[${i + 1}] Source: ${r.source}\nURL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.snippet}`)
      .join("\n\n");

    const prompt = `You are analyzing search results to extract SIGNALS about a company for lead scoring.

COMPANY: ${context.companyName}
LEAD PURPOSE: "${context.leadPurpose}"

SEARCH RESULTS:
${snippetsText}

Extract SIGNALS - observable facts that indicate something about this company. For each signal, determine:
1. Category: company_info, reviews, news, social, problems, competitors, financials, decision_makers
2. Type: What specific thing was found (e.g., "google_review", "linkedin_profile", "news_article", "complaint")
3. Sentiment: positive, negative, or neutral
4. Relevance to Intent: 0-100 how relevant this is to "${context.leadPurpose}"

SIGNAL EXAMPLES:
- "4.2 star rating on Google" -> {category: "reviews", type: "google_rating", sentiment: "positive", relevance: 70}
- "Company is hiring 5 new positions" -> {category: "news", type: "hiring", sentiment: "positive", relevance: 60}
- "Customer complaint about slow service" -> {category: "problems", type: "complaint", sentiment: "negative", relevance: 90}
- "Active Instagram with 5k followers" -> {category: "social", type: "instagram_presence", sentiment: "positive", relevance: 40}

Return JSON only:
{
  "signals": [
    {
      "category": "reviews|news|social|problems|company_info|decision_makers|competitors|financials",
      "type": "specific signal type",
      "value": "the actual finding",
      "sentiment": "positive|negative|neutral",
      "source": "source name",
      "sourceUrl": "URL",
      "evidence": "exact quote proving this",
      "confidence": "high|medium",
      "relevanceToIntent": 0-100
    }
  ]
}

Only extract signals that are EXPLICITLY stated in the snippets. Return empty array if nothing found.`;

    try {
      const response = await this.aiClient.complete({
        messages: [{ role: "user", content: prompt }],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      const signals = Array.isArray(parsed.signals) ? parsed.signals : [];
      console.log(`[ResearchAgent] Extracted ${signals.length} signals`);
      return signals;
    } catch (error) {
      console.error("[ResearchAgent] Signal extraction failed:", error);
      return [];
    }
  }

  /**
   * Compute score breakdown from collected signals
   */
  private computeScoreBreakdown(result: ResearchResult): void {
    const signals = result.signals;

    // Reputation score - from reviews
    const reviewSignals = signals.filter(s => s.category === "reviews");
    const positiveReviews = reviewSignals.filter(s => s.sentiment === "positive").length;
    const negativeReviews = reviewSignals.filter(s => s.sentiment === "negative").length;
    result.scoreBreakdown.reputationScore = reviewSignals.length > 0
      ? Math.round((positiveReviews / reviewSignals.length) * 100)
      : 50; // Default if no review data

    // Online presence score - from social and company_info
    const presenceSignals = signals.filter(s =>
      s.category === "social" || s.category === "company_info"
    );
    result.scoreBreakdown.onlinePresenceScore = Math.min(100, presenceSignals.length * 15);

    // Growth signals score - from news, financials
    const growthSignals = signals.filter(s =>
      s.category === "news" || s.category === "financials"
    );
    const positiveGrowth = growthSignals.filter(s => s.sentiment === "positive").length;
    result.scoreBreakdown.growthSignalsScore = Math.min(100, positiveGrowth * 25);

    // Intent match score - average relevance of signals
    const relevantSignals = signals.filter(s => s.relevanceToIntent > 50);
    result.scoreBreakdown.intentMatchScore = relevantSignals.length > 0
      ? Math.round(relevantSignals.reduce((sum, s) => sum + s.relevanceToIntent, 0) / relevantSignals.length)
      : 30;

    // Accessibility score - based on decision makers with contacts
    const dmWithContacts = result.decisionMakers.filter(dm => dm.contacts.length > 0);
    result.scoreBreakdown.accessibilityScore = dmWithContacts.length > 0
      ? Math.min(100, dmWithContacts.length * 40 + dmWithContacts.reduce((sum, dm) => sum + dm.contacts.length * 10, 0))
      : 10;

    console.log(`[ResearchAgent] Score breakdown computed:`, result.scoreBreakdown);
  }

  /**
   * AI plans comprehensive deep searches based on gaps in data
   */
  private async planSearches(
    context: ResearchContext,
    currentResult: ResearchResult,
    previousSearchResults: SearchResult[]
  ): Promise<{ complete: boolean; queries: string[]; categories: string[] }> {
    // Check what we have so far
    const dmWithContacts = currentResult.decisionMakers.filter(dm => dm.contacts.length > 0);
    const dmNames = currentResult.decisionMakers.map(dm => `${dm.firstName} ${dm.lastName} (${dm.title || 'unknown title'})`);
    const signalCategories = [...new Set(currentResult.signals.map(s => s.category))];
    const iteration = currentResult.iterationsUsed;

    const prompt = `You are a professional client acquisition specialist conducting DEEP RESEARCH to build a comprehensive profile of a potential lead.

COMPANY: ${context.companyName}
DOMAIN: ${context.domain || "unknown"}
LEAD PURPOSE/INTENT: "${context.leadPurpose}"

CURRENT RESEARCH STATUS:
- Iteration: ${iteration}/${MAX_RESEARCH_ITERATIONS}
- Industry: ${context.existingData.industry || currentResult.industry || "MISSING"}
- Location: ${context.existingData.location || currentResult.location || "MISSING"}
- Employee Count: ${context.existingData.employeeCount || currentResult.employeeCount || "MISSING"}
- Decision Makers: ${currentResult.decisionMakers.length} (with contact: ${dmWithContacts.length})
${dmNames.length > 0 ? `- Known Names: ${dmNames.join(', ')}` : ''}
- Signals Collected: ${currentResult.signals.length}
- Categories Covered: ${signalCategories.join(', ') || 'NONE'}
- Issues Found: ${currentResult.issues.length}

PREVIOUS SEARCHES (last 15):
${previousSearchResults.slice(-15).map(r => `- "${r.query}"`).join('\n') || "None yet"}

DEEP SEARCH CATEGORIES TO COVER:
1. **company_info**: Basic company details, size, founding date, services
2. **decision_makers**: Owners, executives, managers, their LinkedIn/contact info
3. **reviews**: Google reviews, Yelp, BBB, Trustpilot, customer testimonials
4. **news**: Press releases, news articles, announcements, awards
5. **social**: Facebook, Instagram, Twitter presence and activity
6. **problems**: Complaints, negative reviews, challenges, pain points
7. **competitors**: Who they compete with, market position
8. **financials**: Revenue estimates, growth, hiring activity

YOUR TASK:
Based on the lead purpose "${context.leadPurpose}", plan searches that will:
1. Find decision makers with contact information
2. Discover signals relevant to the lead purpose (problems you can solve, opportunities)
3. Build a complete picture for lead scoring

SEARCH STRATEGIES:
- Company + "owner", "CEO", "founder", "manager"
- Company + "reviews", "complaints", "problems"
- Company + location for local business info
- "site:linkedin.com" + company name
- Company + "news", "press release", "announcement"
- Company + specific pain points related to "${context.leadPurpose}"
- If you have a person name: search for their email, LinkedIn, social profiles

Research is COMPLETE when:
- We have at least 1 decision maker with contact info, AND
- We have signals from at least 4 different categories, AND
- We have at least 3 issues/opportunities identified
OR we've reached iteration 8

Return JSON only:
{
  "complete": boolean,
  "reasoning": "brief explanation of current strategy",
  "categories": ["category1", "category2"], // which categories these queries target
  "queries": ["search query 1", "search query 2", "search query 3", "search query 4"] // max 4 queries
}`;

    try {
      const response = await this.aiClient.complete({
        messages: [{ role: "user", content: prompt }],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      console.log(`[ResearchAgent] Plan: ${parsed.reasoning}`);
      console.log(`[ResearchAgent] Categories: ${parsed.categories?.join(', ') || 'general'}`);
      return {
        complete: parsed.complete === true,
        queries: Array.isArray(parsed.queries) ? parsed.queries : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : ["general"],
      };
    } catch (error) {
      console.error("[ResearchAgent] Planning failed:", error);
      return { complete: false, queries: [], categories: [] };
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

    const prompt = `You are a professional research expert extracting VERIFIED facts from search results about "${context.companyName}".

SEARCH RESULTS:
${snippetsText}

STRICT RULES:
1. Extract ONLY facts that are EXPLICITLY stated in the snippets
2. Do NOT invent or assume any information - if it's not in the text, don't include it
3. Include the source URL and exact evidence quote for each fact
4. Mark confidence: "high" if directly stated, "medium" if strongly implied

PRIMARY GOAL: Find decision makers with their contact information!

Extract these fields (in priority order):
1. **decisionMaker**: Full name of owner, CEO, founder, president, manager, director
2. **contactEmail**: Email addresses found (format: {"name": "Person Name", "email": "email@example.com"})
3. **contactPhone**: Phone numbers found (format: {"name": "Person Name", "phone": "+1234567890"})
4. **contactLinkedIn**: LinkedIn profile URLs (format: {"name": "Person Name", "linkedin": "linkedin.com/in/..."})
5. **contactSocial**: Other social profiles - Twitter, Instagram, Facebook (format: {"name": "Person Name", "type": "twitter|instagram|facebook", "url": "..."})
6. industry, location, employeeCount, description (secondary priority)

LOOK FOR PATTERNS:
- Email patterns: name@domain.com, info@, contact@
- LinkedIn: linkedin.com/in/, linkedin.com/company/
- Phone: numbers with area codes, formatted phone numbers
- Social: twitter.com/, instagram.com/, facebook.com/

Return JSON only:
{
  "facts": [
    {
      "field": "decisionMaker|contactEmail|contactPhone|contactLinkedIn|contactSocial|industry|location|employeeCount|description",
      "value": "extracted value or object",
      "source": "source URL or name",
      "evidence": "exact quote from snippet proving this fact",
      "confidence": "high|medium"
    }
  ]
}

Return empty facts array if nothing can be verified from the snippets.`;

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
                  title: fact.evidence.match(/(?:CEO|Owner|Founder|President|Director|Manager|Partner|VP|Chief|Head)/i)?.[0],
                  source: fact.source,
                  evidence: fact.evidence,
                  contacts: [],
                });
                console.log(`[ResearchAgent] Found decision maker: ${fact.value}`);
              }
            }
          }
          break;
        case "contactEmail":
          this.addContactToDecisionMaker(result, fact, "email");
          break;
        case "contactPhone":
          this.addContactToDecisionMaker(result, fact, "phone");
          break;
        case "contactLinkedIn":
          this.addContactToDecisionMaker(result, fact, "linkedin");
          break;
        case "contactSocial":
          this.addSocialContactToDecisionMaker(result, fact);
          break;
      }
    }
  }

  /**
   * Add contact info to an existing decision maker or create new one
   */
  private addContactToDecisionMaker(
    result: ResearchResult,
    fact: ExtractedFact,
    contactType: "email" | "phone" | "linkedin"
  ): void {
    let contactValue: string;
    let personName: string | undefined;

    // Parse the value - could be string or object
    if (typeof fact.value === "object" && fact.value !== null) {
      const obj = fact.value as Record<string, string>;
      personName = obj.name;
      contactValue = obj.email || obj.phone || obj.linkedin || "";
    } else {
      contactValue = String(fact.value);
    }

    if (!contactValue) return;

    // Find matching decision maker by name, or use first one, or create new
    let dm = personName
      ? result.decisionMakers.find(d =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(personName!.toLowerCase()) ||
          personName!.toLowerCase().includes(d.firstName.toLowerCase())
        )
      : result.decisionMakers[0];

    if (!dm && personName) {
      // Create new decision maker from contact info
      const nameParts = personName.split(/\s+/);
      if (nameParts.length >= 1) {
        dm = {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
          source: fact.source,
          evidence: fact.evidence,
          contacts: [],
        };
        result.decisionMakers.push(dm);
        console.log(`[ResearchAgent] Created decision maker from contact: ${personName}`);
      }
    }

    if (dm) {
      // Check if this contact already exists
      const exists = dm.contacts.some(c => c.type === contactType && c.value === contactValue);
      if (!exists) {
        dm.contacts.push({
          type: contactType,
          value: contactValue,
          source: fact.source,
          evidence: fact.evidence,
        });
        console.log(`[ResearchAgent] Added ${contactType} for ${dm.firstName}: ${contactValue}`);
      }
    }
  }

  /**
   * Add social media contact (twitter, instagram, facebook)
   */
  private addSocialContactToDecisionMaker(result: ResearchResult, fact: ExtractedFact): void {
    if (typeof fact.value !== "object" || fact.value === null) return;

    const obj = fact.value as Record<string, string>;
    const personName = obj.name;
    const socialType = obj.type as "twitter" | "instagram" | "facebook";
    const url = obj.url;

    if (!socialType || !url) return;

    let dm = personName
      ? result.decisionMakers.find(d =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(personName.toLowerCase())
        )
      : result.decisionMakers[0];

    if (!dm && personName) {
      const nameParts = personName.split(/\s+/);
      if (nameParts.length >= 1) {
        dm = {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
          source: fact.source,
          evidence: fact.evidence,
          contacts: [],
        };
        result.decisionMakers.push(dm);
      }
    }

    if (dm) {
      const exists = dm.contacts.some(c => c.type === socialType && c.value === url);
      if (!exists) {
        dm.contacts.push({
          type: socialType,
          value: url,
          source: fact.source,
          evidence: fact.evidence,
        });
        console.log(`[ResearchAgent] Added ${socialType} for ${dm.firstName}: ${url}`);
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
