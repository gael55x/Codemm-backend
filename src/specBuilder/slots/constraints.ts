import type { ActivitySpec } from "../../contracts/activitySpec";
import type { SlotContext, SpecSlot } from "./types";

const DEFAULT_CONSTRAINTS = "Java 17, JUnit 5, no package declarations.";

export const constraintsSlot: SpecSlot<ActivitySpec["constraints"]> = {
  key: "constraints",
  prompt: "I'll handle the Java/JUnit setup. Anything else you want noted?",
  normalize: (_input, _ctx) => DEFAULT_CONSTRAINTS,
  validate: (_value) => null,
  autoFill: () => DEFAULT_CONSTRAINTS,
  hint: () => "You can just say 'ok' — the defaults are applied automatically.",
};
