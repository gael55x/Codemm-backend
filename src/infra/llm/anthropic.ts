import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

/**
 * Singleton Anthropic client.
 * Extracted from legacy ProblemAgent for reuse in v1.0 generation.
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in the environment.");
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}
