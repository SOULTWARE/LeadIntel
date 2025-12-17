/**
 * Search Adapter for Lead Discovery
 *
 * IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * This adapter provides a pluggable interface for search providers.
 * Currently implements OpenAI Responses API with web_search tool.
 * Future: Bing, SerpAPI, Brave adapters.
 */

export type SearchProvider = "bing" | "serpapi" | "brave" | "openai";

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  provider: SearchProvider;
  rawResponse?: unknown;
}

export interface SearchAdapterConfig {
  provider: SearchProvider;
  apiKey: string;
  userAgent?: string;
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface ISearchAdapter {
  search(query: string): Promise<SearchResponse>;
  searchWithGPT(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }>;
}

/**
 * OpenAI-based search adapter using Responses API with web_search tool.
 * This is the default/stub implementation.
 */
export class OpenAISearchAdapter implements ISearchAdapter {
  private apiKey: string;
  private model: string;
  private maxRetries: number;
  private baseDelayMs: number;

  constructor(config: SearchAdapterConfig) {
    this.apiKey = config.apiKey;
    this.model = "gpt-4o";
    this.maxRetries = config.maxRetries ?? 3;
    this.baseDelayMs = config.baseDelayMs ?? 1000;
  }

  async search(query: string): Promise<SearchResponse> {
    const response = await this.searchWithGPT(
      "You are a search assistant. Return search results as JSON.",
      `Search for: ${query}. Return results as JSON array with url, title, snippet fields.`
    );

    let results: SearchResult[] = [];
    try {
      const parsed = JSON.parse(response.content);
      results = Array.isArray(parsed) ? parsed : parsed.results ?? [];
    } catch {
      results = response.searchResults;
    }

    return {
      query,
      results,
      provider: "openai",
    };
  }

  async searchWithGPT(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.callOpenAIWithWebSearch(
          systemPrompt,
          userPrompt
        );
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isRetryableError(error)) {
          const delayMs = this.baseDelayMs * Math.pow(2, attempt);
          await this.sleep(delayMs);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new Error("Search failed after retries");
  }

  private async callOpenAIWithWebSearch(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }> {
    // Try the Responses API first (supports web_search)
    try {
      const responsesResult = await this.tryResponsesAPI(systemPrompt, userPrompt);
      if (responsesResult.content) {
        return responsesResult;
      }
    } catch (error) {
      console.warn("[SearchAdapter] Responses API failed, falling back to Chat Completions:", error);
    }

    // Fallback to standard Chat Completions API (no web search, but more reliable)
    return this.fallbackToChatCompletions(systemPrompt, userPrompt);
  }

  private async tryResponsesAPI(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        tools: [{ type: "web_search" }],
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();

      if (status === 429 || status >= 500) {
        const error = new Error(`OpenAI Responses API error: ${status} - ${errorText}`);
        (error as RetryableError).retryable = true;
        throw error;
      }

      throw new Error(`OpenAI Responses API error: ${status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[SearchAdapter] Responses API raw response:", JSON.stringify(data).slice(0, 500));

    const content = this.extractContent(data);
    const searchResults = this.extractSearchResults(data);

    return { content, searchResults };
  }

  private async fallbackToChatCompletions(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }> {
    console.log("[SearchAdapter] Using Chat Completions API fallback");

    // Modify system prompt to wrap array in object for json_object mode
    const wrappedSystemPrompt = systemPrompt + `\n\nIMPORTANT: Wrap your JSON array in an object like this: {"candidates": [...]}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: wrappedSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();

      if (status === 429 || status >= 500) {
        const error = new Error(`OpenAI Chat API error: ${status} - ${errorText}`);
        (error as RetryableError).retryable = true;
        throw error;
      }

      throw new Error(`OpenAI Chat API error: ${status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";

    // Unwrap the candidates array if wrapped in object
    try {
      const parsed = JSON.parse(content);
      if (parsed.candidates && Array.isArray(parsed.candidates)) {
        content = JSON.stringify(parsed.candidates);
      }
    } catch {
      // Keep original content if parsing fails
    }

    return { content, searchResults: [] };
  }

  private extractContent(data: OpenAIResponseData): string {
    if (data.output) {
      for (const item of data.output) {
        if (item.type === "message" && item.content) {
          for (const block of item.content) {
            if (block.type === "text") {
              return block.text;
            }
          }
        }
      }
    }
    return "";
  }

  private extractSearchResults(data: OpenAIResponseData): SearchResult[] {
    const results: SearchResult[] = [];

    if (data.output) {
      for (const item of data.output) {
        if (item.type === "web_search_call" && item.results) {
          for (const result of item.results) {
            results.push({
              url: result.url ?? "",
              title: result.title ?? "",
              snippet: result.snippet ?? "",
            });
          }
        }
      }
    }

    return results;
  }

  private isRetryableError(error: unknown): boolean {
    if (error && typeof error === "object" && "retryable" in error) {
      return (error as RetryableError).retryable === true;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

interface RetryableError extends Error {
  retryable: boolean;
}

interface OpenAIResponseData {
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text: string }>;
    results?: Array<{ url?: string; title?: string; snippet?: string }>;
  }>;
}

/**
 * SerpAPI-based search adapter.
 * Uses SerpAPI for Google search results, then GPT for parsing.
 */
export class SerpAPISearchAdapter implements ISearchAdapter {
  private apiKey: string;
  private openaiApiKey: string;
  private model: string;

  constructor(config: SearchAdapterConfig) {
    this.apiKey = config.apiKey;
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
    this.model = "gpt-4o";
  }

  async search(query: string): Promise<SearchResponse> {
    const url = new URL("https://serpapi.com/search");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("engine", "google");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // Extract organic results
    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const result of data.organic_results.slice(0, 10)) {
        results.push({
          url: result.link || "",
          title: result.title || "",
          snippet: result.snippet || "",
        });
      }
    }

    return {
      query,
      results,
      provider: "serpapi",
      rawResponse: data,
    };
  }

  async searchWithGPT(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ content: string; searchResults: SearchResult[] }> {
    // Extract search query from user prompt
    const queryMatch = userPrompt.match(/Search for companies matching: "([^"]+)"/);
    const searchQuery = queryMatch ? queryMatch[1] : userPrompt.slice(0, 100);

    // Perform SerpAPI search
    const searchResponse = await this.search(searchQuery);

    // Build context from search results
    const searchContext = searchResponse.results
      .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
      .join("\n\n");

    // Use GPT to parse results into structured format
    const gptPrompt = `Based on these search results, ${userPrompt}

SEARCH RESULTS:
${searchContext}

Remember: Return ONLY the JSON array based on the search results above.`;

    // Modify system prompt for json_object mode
    const wrappedSystemPrompt = systemPrompt + `\n\nIMPORTANT: Wrap your JSON array in an object like this: {"candidates": [...]}`;

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: wrappedSystemPrompt },
          { role: "user", content: gptPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`OpenAI API error: ${gptResponse.status} - ${await gptResponse.text()}`);
    }

    const gptData = await gptResponse.json();
    let content = gptData.choices?.[0]?.message?.content ?? "";

    // Unwrap the candidates array if wrapped in object
    try {
      const parsed = JSON.parse(content);
      if (parsed.candidates && Array.isArray(parsed.candidates)) {
        content = JSON.stringify(parsed.candidates);
      }
    } catch {
      // Keep original content if parsing fails
    }

    return { content, searchResults: searchResponse.results };
  }
}

/**
 * Factory function to create the appropriate search adapter based on provider.
 */
export function createSearchAdapter(config: SearchAdapterConfig): ISearchAdapter {
  switch (config.provider) {
    case "openai":
      return new OpenAISearchAdapter(config);
    case "serpapi":
      return new SerpAPISearchAdapter(config);
    case "bing":
    case "brave":
      throw new Error(
        `Search provider "${config.provider}" not yet implemented. Use "openai" or "serpapi".`
      );
    default:
      throw new Error(`Unknown search provider: ${config.provider}`);
  }
}

/**
 * Get search adapter from environment variables.
 */
export function getSearchAdapterFromEnv(): ISearchAdapter {
  const provider = (process.env.SEARCH_PROVIDER as SearchProvider) || "openai";
  const apiKey = process.env.SEARCH_API_KEY || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    throw new Error("SEARCH_API_KEY or OPENAI_API_KEY is required");
  }

  return createSearchAdapter({
    provider,
    apiKey,
    userAgent: process.env.FETCH_USER_AGENT,
  });
}
