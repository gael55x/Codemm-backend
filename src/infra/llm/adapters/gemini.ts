import type { CompletionOpts, CompletionResult } from "../types";

// Default to a broadly available model (free keys often lack access to Pro).
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

function getGeminiApiKey(): string | null {
  const k = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}

export async function createGeminiCompletion(
  opts: CompletionOpts,
  auth?: { apiKey?: string; baseURL?: string }
): Promise<CompletionResult> {
  const apiKey = auth?.apiKey ?? getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in the environment.");
  const apiKeyStr = apiKey;

  const baseURL = (auth?.baseURL ?? process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta").replace(
    /\/+$/,
    ""
  );
  const preferredModel = opts.model ?? process.env.GEMINI_MODEL ?? process.env.CODEX_MODEL ?? DEFAULT_GEMINI_MODEL;

  // Conservative: combine system + user to avoid API/version quirks around system instruction fields.
  const prompt = `${opts.system}\n\n${opts.user}`.trim();

  async function requestOnce(model: string): Promise<{ status: number; raw: string }> {
    const url = `${baseURL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKeyStr)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.3,
          maxOutputTokens: opts.maxTokens ?? 5000,
        },
      }),
    });
    return { status: res.status, raw: await res.text() };
  }

  // Some free-tier keys don't have access to Pro models. If a preferred model 404s, retry with Flash.
  let finalRaw: string;
  let finalStatus: number;
  const first = await requestOnce(preferredModel);
  finalRaw = first.raw;
  finalStatus = first.status;
  if (finalStatus === 404 && preferredModel !== DEFAULT_GEMINI_MODEL) {
    const retry = await requestOnce(DEFAULT_GEMINI_MODEL);
    finalRaw = retry.raw;
    finalStatus = retry.status;
  }
  if (finalStatus < 200 || finalStatus >= 300) {
    throw new Error(`Gemini API error (${finalStatus}): ${finalRaw.slice(0, 800)}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(finalRaw);
  } catch {
    throw new Error(`Gemini API returned non-JSON: ${finalRaw.slice(0, 800)}`);
  }

  const parts = parsed?.candidates?.[0]?.content?.parts;
  const text =
    Array.isArray(parts)
      ? parts
          .map((p: any) => (p && typeof p.text === "string" ? p.text : ""))
          .join("")
          .trim()
      : "";

  return { content: [{ type: "text", text }] };
}
