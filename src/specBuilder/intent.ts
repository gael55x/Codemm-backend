import type { JsonPatchOp } from "./patch";
import { applyJsonPatch } from "./patch";
import type { SpecSlot, SlotContext } from "./slots/types";
import { SPEC_SLOTS } from "./slotRegistry";
import type { SpecDraft } from "./validators";
import { validatePatchedSpecOrError } from "./validators";

export type SlotResolutionResult =
  | {
      accepted: true;
      patch: JsonPatchOp[];
      prompt?: string;
    }
  | {
      accepted: false;
      hint?: string;
      prompt?: string;
    };

function findNextSlot(spec: SpecDraft): SpecSlot<any> | null {
  for (const slot of SPEC_SLOTS) {
    const current = (spec as any)[slot.key];
    if (current == null || (slot.key === "constraints" && typeof current !== "string")) {
      return slot;
    }
  }
  return null;
}

export function nextSlotKey(spec: SpecDraft): string | null {
  const slot = findNextSlot(spec);
  return slot ? (slot.key as string) : null;
}

export function resolveNextSlot(spec: SpecDraft, userInput: string): SlotResolutionResult {
  const slot = findNextSlot(spec);
  if (!slot) {
    return {
      accepted: false,
      prompt: "Spec looks complete. You can generate the activity.",
      hint: "Spec is already complete.",
    };
  }

  const ctx: SlotContext = { spec: { ...spec } as any };
  const trimmed = userInput.trim();
  const inputToUse = trimmed || slot.autoFill?.(ctx) || "";

  const normalized = slot.normalize(inputToUse, ctx);
  if (normalized == null) {
    return {
      accepted: false,
      prompt: slot.prompt,
      hint: slot.hint?.(ctx) ?? "I didn't catch that. Try a concise answer.",
    };
  }

  const validationError = slot.validate(normalized, ctx);
  if (validationError) {
    return {
      accepted: false,
      prompt: slot.prompt,
      hint: validationError,
    };
  }

  const patch: JsonPatchOp[] = [
    { op: (spec as any)[slot.key] == null ? "add" : "replace", path: `/${slot.key}`, value: normalized },
  ];

  const patched = applyJsonPatch(spec as any, patch);
  const contractError = validatePatchedSpecOrError(patched);
  if (contractError) {
    return {
      accepted: false,
      prompt: slot.prompt,
      hint: slot.hint?.(ctx) ?? "Let's tweak that to fit the builder.",
    };
  }

  return { accepted: true, patch, prompt: slot.prompt };
}
