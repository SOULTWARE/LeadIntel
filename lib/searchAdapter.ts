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
        const error = new Error(`OpenAI API error: ${status} - ${errorText}`);
        (error as RetryableError).retryable = true;
        throw error;
      }

      throw new Error(`OpenAI API error: ${status} - ${errorText}`);
    }

    const data = await response.json();

    const content = this.extractContent(data);
    const searchResults = this.extractSearchResults(data);

    return { content, searchResults };
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
 * Factory function to create the appropriate search adapter based on provider.
 */
export function createSearchAdapter(config: SearchAdapterConfig): ISearchAdapter {
  switch (config.provider) {
    case "openai":
      return new OpenAISearchAdapter(config);
    case "bing":
    case "serpapi":
    case "brave":
      throw new Error(
        `Search provider "${config.provider}" not yet implemented. Use "openai" for now.`
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
