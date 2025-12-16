import { OpenAIClient } from './openaiClient';
import type { AIClient } from './types';

export type { AIClient, AIClientConfig, AICompletionRequest, AICompletionResponse, AIMessage } from './types';
export { OpenAIClient } from './openaiClient';

let defaultClient: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!defaultClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    defaultClient = new OpenAIClient({
      apiKey,
      model: process.env.AI_MODEL ?? 'gpt-4o',
    });
  }
  return defaultClient;
}

export function setAIClient(client: AIClient): void {
  defaultClient = client;
}
