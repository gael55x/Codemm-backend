import type { ProblemSlot } from "../planner/types";
import { getLanguageProfile } from "../languages/profiles";

export function getSystemPromptForSlot(slot: ProblemSlot): string {
  const profile = getLanguageProfile(slot.language);
  if (!profile.generator) {
    throw new Error(`No generator configured for language "${slot.language}".`);
  }
  return profile.generator.systemPrompt;
}

export function buildSlotPrompt(slot: ProblemSlot): string {
  const profile = getLanguageProfile(slot.language);
  if (!profile.generator) {
    throw new Error(`No generator configured for language "${slot.language}".`);
  }
  return profile.generator.buildSlotPrompt(slot);
}
