import type { ActivitySpec } from "../contracts/activitySpec";
import type { JsonPatchOp } from "./patch";
import { applyJsonPatch } from "./patch";
import { QUESTION_ORDER, QUESTIONS, type SpecQuestionKey } from "./questions";
import {
  buildPatchForConstraints,
  buildPatchForDifficultyPlan,
  buildPatchForLanguage,
  buildPatchForProblemCount,
  buildPatchForProblemStyle,
  buildPatchForTopicTags,
  ensureFixedFields,
  isSpecComplete,
  validatePatchedSpecOrError,
  type SpecDraft,
} from "./validators";

export type SpecBuilderResult = {
  accepted: boolean;
  patch?: JsonPatchOp[];
  nextQuestion: string;
  done: boolean;
  error?: string;
  // convenience for callers
  spec?: SpecDraft;
};

export function getNextQuestionKey(spec: SpecDraft): SpecQuestionKey | null {
  for (const key of QUESTION_ORDER) {
    switch (key) {
      case "language":
        if (spec.language == null) return "language";
        if (spec.language !== "java") return "language";
        break;
      case "problem_count":
        if (typeof spec.problem_count !== "number") return "problem_count";
        if (!Number.isInteger(spec.problem_count) || spec.problem_count < 1 || spec.problem_count > 7) {
          return "problem_count";
        }
        break;
      case "difficulty_plan":
        if (!Array.isArray(spec.difficulty_plan) || spec.difficulty_plan.length === 0) {
          return "difficulty_plan";
        }
        break;
      case "topic_tags":
        if (!Array.isArray(spec.topic_tags) || spec.topic_tags.length === 0) return "topic_tags";
        break;
      case "problem_style":
        if (typeof spec.problem_style !== "string" || !spec.problem_style.trim()) return "problem_style";
        break;
      case "constraints":
        if (typeof spec.constraints !== "string" || !spec.constraints.trim()) return "constraints";
        // Must pass the contract's refine (no package + junit)
        {
          const c = spec.constraints.toLowerCase();
          const ok = c.includes("no package") && (c.includes("junit") || c.includes("junit 5"));
          if (!ok) return "constraints";
        }
        break;
      default:
        return key;
    }
  }

  return null;
}

export function getNextQuestion(spec: SpecDraft): string {
  const key = getNextQuestionKey(spec);
  if (!key) {
    return "Spec looks complete. You can generate the activity.";
  }
  return QUESTIONS[key];
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

  const key = getNextQuestionKey(specWithFixed);
  if (!key) {
    return {
      accepted: false,
      nextQuestion: "Spec looks complete. You can generate the activity.",
      done: true,
      spec: specWithFixed,
    };
  }

  const answer = userMessage.trim();
  if (!answer) {
    return {
      accepted: false,
      nextQuestion: QUESTIONS[key],
      done: false,
      error: "Please provide an answer.",
      spec: specWithFixed,
    };
  }

  let patch: JsonPatchOp[] | undefined;
  let error: string | undefined;

  switch (key) {
    case "language": {
      const r = buildPatchForLanguage(answer);
      patch = r.patch;
      error = r.error;
      break;
    }
    case "problem_count": {
      const r = buildPatchForProblemCount(answer);
      patch = r.patch;
      error = r.error;
      break;
    }
    case "difficulty_plan": {
      const r = buildPatchForDifficultyPlan(specWithFixed, answer);
      patch = r.patch;
      error = r.error;
      break;
    }
    case "topic_tags": {
      const r = buildPatchForTopicTags(answer);
      patch = r.patch;
      error = r.error;
      break;
    }
    case "problem_style": {
      const r = buildPatchForProblemStyle(answer);
      patch = r.patch;
      error = r.error;
      break;
    }
    case "constraints": {
      const r = buildPatchForConstraints(answer);
      patch = r.patch;
      error = r.error;
      break;
    }
  }

  if (!patch || error) {
    return {
      accepted: false,
      nextQuestion: QUESTIONS[key],
      done: false,
      error: error ?? "Invalid answer.",
      spec: specWithFixed,
    };
  }

  // Prepend fixed patches if we actually had to set them.
  const fullPatch = [...fixed, ...patch];

  const patched = applyJsonPatch(specWithFixed as any, patch);

  // Validate immediately (strict contract). Reject if invalid.
  const contractError = validatePatchedSpecOrError(patched);
  if (contractError) {
    return {
      accepted: false,
      nextQuestion: QUESTIONS[key],
      done: false,
      error: contractError,
      spec: specWithFixed,
    };
  }

  const done = isSpecComplete(patched);
  return {
    accepted: true,
    patch: fullPatch,
    nextQuestion: done ? "Spec looks complete. You can generate the activity." : getNextQuestion(patched),
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
