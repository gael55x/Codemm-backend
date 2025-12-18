import type { ActivitySpec } from "../../contracts/activitySpec";
import { CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE } from "../../contracts/activitySpec";
import type { SlotContext, SpecSlot } from "./types";

export const constraintsSlot: SpecSlot<ActivitySpec["constraints"]> = {
  key: "constraints",
  prompt: "I'll handle the runtime/test setup automatically. Anything else you want noted?",
  normalize: (_input, ctx) => CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[ctx.spec.language ?? "java"],
  validate: (_value) => null,
  autoFill: (ctx) => CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[ctx.spec.language ?? "java"],
  hint: () => "You can just say 'ok' — the defaults are applied automatically.",
};
