import type { ActivitySpec } from "../contracts/activitySpec";
import type { SpecDraft } from "../compiler/specDraft";
import type { SpecGaps } from "./specAnalysis";
import type { UserEditableSpecKey } from "./dialogue";
import type { CommitmentStore } from "./commitments";

export type ConversationGoalId = "content" | "scope" | "difficulty" | "checking" | "language";

export type ConversationGoal = {
  id: ConversationGoalId;
  fields: UserEditableSpecKey[];
};

export const DEFAULT_GOALS: ConversationGoal[] = [
  { id: "content", fields: ["topic_tags"] },
  { id: "scope", fields: ["problem_count"] },
  { id: "difficulty", fields: ["difficulty_plan"] },
  { id: "checking", fields: ["problem_style"] },
  { id: "language", fields: ["language"] },
];

function fieldPresent(spec: SpecDraft, field: UserEditableSpecKey): boolean {
  return (spec as any)[field] !== undefined;
}

function fieldLocked(commitments: CommitmentStore | null | undefined, field: UserEditableSpecKey): boolean {
  return commitments?.[field as keyof ActivitySpec]?.locked === true;
}

export function selectNextGoal(args: {
  spec: SpecDraft;
  gaps: SpecGaps;
  commitments?: CommitmentStore | null | undefined;
}): ConversationGoalId | null {
  if (args.gaps.complete) return null;

  for (const goal of DEFAULT_GOALS) {
    const needsAny = goal.fields.some((f) => {
      if (fieldLocked(args.commitments, f) && fieldPresent(args.spec, f)) return false;
      const key = f as keyof ActivitySpec;
      return args.gaps.missing.includes(key) || args.gaps.invalid[key] != null || !fieldPresent(args.spec, f);
    });
    if (needsAny) return goal.id;
  }

  return null;
}
