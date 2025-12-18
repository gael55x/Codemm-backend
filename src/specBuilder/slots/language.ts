import type { ActivitySpec } from "../../contracts/activitySpec";
import { ActivityLanguageSchema } from "../../contracts/activitySpec";
import type { SlotContext, SpecSlot } from "./types";

function normalizeLanguage(input: string): ActivitySpec["language"] | null {
  const text = input.trim().toLowerCase();
  if (text.includes("java")) return "java";
  if (text === "python" || text === "py" || text.includes("python")) return "python";
  return null;
}

export const languageSlot: SpecSlot<ActivitySpec["language"]> = {
  key: "language",
  prompt: "Which language should we use? (Java is available today.)",
  normalize: (input: string) => normalizeLanguage(input),
  validate: (value) => {
    const parsed = ActivityLanguageSchema.safeParse(value);
    if (!parsed.success) return "Supported languages: Java, Python.";
    if (value !== "java") return "Java is available today. Other languages are not enabled yet.";
    return null;
  },
  hint: () => "Try replying with \"Java\".",
};
