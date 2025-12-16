import type { ActivitySpec } from "../contracts/activitySpec";
import { applyJsonPatch, type JsonPatchOp } from "./patch";
import { resolveNextSlot, type SlotResolutionResult } from "./intent";
import { ensureFixedFields, isSpecComplete, type SpecDraft } from "./validators";

export type SpecBuilderResult = {
  accepted: boolean;
  patch?: JsonPatchOp[];
  nextQuestion: string;
  done: boolean;
  error?: string;
  spec?: SpecDraft;
};

export function getNextQuestion(spec: SpecDraft): string {
  const result = resolveNextSlot(spec, "");
  return result.prompt ?? "Spec looks complete. You can generate the activity.";
}

/**
 * PURE SpecBuilder step.
 *
 * Deterministic transformation:
 * (currentSpec, userMessage) -> { accepted, patch?, nextQuestion, done, error? }
 */
export function specBuilderStep(currentSpec: SpecDraft | null, userMessage: string): SpecBuilderResult {
  const base: SpecDraft = currentSpec ? { ...currentSpec } : {};

  // Enforce fixed fields (version + test_case_count) without user interaction.
  const fixed = ensureFixedFields(base);
  const specWithFixed = fixed.length > 0 ? applyJsonPatch(base as any, fixed) : base;

  const resolution: SlotResolutionResult = resolveNextSlot(specWithFixed, userMessage);

  if (!resolution.accepted) {
    return {
      accepted: false,
      nextQuestion: resolution.prompt ?? "Please continue.",
      done: false,
      error: resolution.hint ?? "Invalid answer.",
      spec: specWithFixed,
    };
  }

  const patched = applyJsonPatch(specWithFixed as any, resolution.patch);
  const done = isSpecComplete(patched);
  const nextPrompt = done
    ? "Spec looks complete. You can generate the activity."
    : resolveNextSlot(patched, "").prompt ?? "Continue.";

  return {
    accepted: true,
    patch: [...fixed, ...resolution.patch],
    nextQuestion: nextPrompt,
    done,
    spec: patched,
  };
}

// Convenience guard for callers that want a fully-validated ActivitySpec.
export function assertReadySpec(spec: SpecDraft): ActivitySpec {
  // If it's complete, ActivitySpecSchema will have accepted it.
  if (!isSpecComplete(spec)) {
    throw new Error("ActivitySpec is not complete/valid yet.");
  }
  return spec;
}
