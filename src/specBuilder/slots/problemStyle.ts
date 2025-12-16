import type { ActivitySpec } from "../../contracts/activitySpec";
import type { SlotContext, SpecSlot } from "./types";

function normalizeStyle(input: string): ActivitySpec["problem_style"] | null {
  const lower = input.trim().toLowerCase();
  if (/(stdout|print|console)/.test(lower)) return "stdout";
  if (/(return|method|function)/.test(lower)) return "return";
  if (/(mixed|either|both)/.test(lower)) return "mixed";
  if (lower === "stdout" || lower === "return" || lower === "mixed") return lower as ActivitySpec["problem_style"];
  return null;
}

export const problemStyleSlot: SpecSlot<ActivitySpec["problem_style"]> = {
  key: "problem_style",
  prompt: "How should solutions be checked? (stdout, return, or mixed)",
  normalize: (input) => normalizeStyle(input),
  validate: (value) => {
    const allowed = new Set(["stdout", "return", "mixed"]);
    if (!allowed.has(value)) {
      return "Choose stdout, return, or mixed.";
    }
    return null;
  },
  hint: () => "Reply with stdout, return, or mixed.",
};
