import { constraintsSlot } from "./slots/constraints";
import { difficultyPlanSlot } from "./slots/difficultyPlan";
import { languageSlot } from "./slots/language";
import { problemCountSlot } from "./slots/problemCount";
import { problemStyleSlot } from "./slots/problemStyle";
import { topicTagsSlot } from "./slots/topicTags";
import type { SpecSlot } from "./slots/types";

export const SPEC_SLOTS: SpecSlot<any>[] = [
  languageSlot,
  problemCountSlot,
  difficultyPlanSlot,
  topicTagsSlot,
  problemStyleSlot,
  constraintsSlot,
];

export function getSlotByKey(key: string): SpecSlot<any> | undefined {
  return SPEC_SLOTS.find((s) => s.key === key);
}
