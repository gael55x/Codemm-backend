import type { ActivitySpec } from "../../contracts/activitySpec";
import { ActivityLanguageSchema } from "../../contracts/activitySpec";
import type { SlotContext, SpecSlot } from "./types";

function normalizeLanguage(input: string): ActivitySpec["language"] | null {
  const text = input.trim().toLowerCase();
  if (text.includes("java")) return "java";
  return null;
}

export const languageSlot: SpecSlot<ActivitySpec["language"]> = {
  key: "language",
  prompt: "Which language should we use? (Java is available today.)",
  normalize: (input: string) => normalizeLanguage(input),
  validate: (value) => {
    const parsed = ActivityLanguageSchema.safeParse(value);
    if (!parsed.success) return "We only support Java right now.";
    return null;
  },
  hint: () => "Try replying with \"Java\".",
};
