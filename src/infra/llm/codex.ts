import OpenAI from "openai";

let codexClient: OpenAI | null = null;

export function getCodexClient(): OpenAI {
  if (!process.env.CODEX_API_KEY) {
    throw new Error("CODEX_API_KEY is not set in the environment.");
  }
  if (!codexClient) {
    codexClient = new OpenAI({
      apiKey: process.env.CODEX_API_KEY,
      baseURL: process.env.CODEX_BASE_URL, // optional override for self-hosted Codex
    });
  }
  return codexClient;
}

export async function createCodexCompletion(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const client = getCodexClient();
  const completion = await client.chat.completions.create({
    model: opts.model ?? process.env.CODEX_MODEL ?? "gpt-4.1",
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 5000,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  // Normalize to the same shape Anthropic returns so the downstream parsing stays unchanged
  return { content: [{ type: "text", text }] };
}
