import type { ActivitySpec } from "../contracts/activitySpec";
import type { SpecDraft } from "../specBuilder/validators";
import { computeReadiness, type ConfidenceMap } from "./readiness";

const MISSING_PRIORITY: (keyof ActivitySpec)[] = [
  "language",
  "problem_count",
  "difficulty_plan",
  "topic_tags",
  "problem_style",
];

/**
 * Stable identifier for "what question are we currently trying to answer?"
 * Used to decide whether to keep buffering messages or reset the buffer.
 */
export function getDynamicQuestionKey(
  spec: SpecDraft,
  confidence: ConfidenceMap | null | undefined
): string | null {
  const readiness = computeReadiness(spec, confidence);
  if (readiness.ready) return "ready";

  if (readiness.gaps.complete && readiness.lowConfidenceFields.length > 0) {
    return `confirm:${readiness.lowConfidenceFields.map(String).sort().join(",")}`;
  }

  const nextMissing =
    MISSING_PRIORITY.find((k) => readiness.gaps.missing.includes(k)) ??
    readiness.gaps.missing[0];
  if (nextMissing) return String(nextMissing);

  const invalidKeys = Object.keys(readiness.gaps.invalid);
  if (invalidKeys.length > 0) return `invalid:${invalidKeys[0]}`;

  return null;
}

