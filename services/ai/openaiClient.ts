import type { AIClient, AIClientConfig, AICompletionRequest, AICompletionResponse } from './types';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;

export class OpenAIClient implements AIClient {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private baseUrl: string;

  constructor(config: AIClientConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gpt-4o';
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 0.1;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: request.messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            response_format:
              request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          // Handle rate limiting (429) and server errors (5xx) with retry
          if (response.status === 429 || response.status >= 500) {
            lastError = new Error(`OpenAI API error: ${response.status} - ${errorText}`);

            // Extract retry-after from error message if available
            let delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
            const retryAfterMatch = errorText.match(/try again in (\d+\.?\d*)s/i);
            if (retryAfterMatch) {
              delayMs = Math.ceil(parseFloat(retryAfterMatch[1]) * 1000) + 500; // Add 500ms buffer
            }
            delayMs = Math.min(delayMs, MAX_DELAY_MS);

            console.log(`[OpenAI] Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await this.sleep(delayMs);
            continue;
          }

          // Non-retryable error
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return {
          content: data.choices[0]?.message?.content ?? '',
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
              }
            : undefined,
        };
      } catch (error) {
        // If it's a network error, retry
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = error;
          const delayMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
          console.log(`[OpenAI] Network error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await this.sleep(delayMs);
          continue;
        }
        throw error;
      }
    }

    throw lastError ?? new Error('OpenAI API request failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
