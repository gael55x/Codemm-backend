import type { SpecDraft } from "../compiler/specDraft";
import type { SpecGaps } from "./specAnalysis";
import type { UserEditableSpecKey } from "./dialogue";
import type { CommitmentStore } from "./commitments";
export type ConversationGoalId = "content" | "scope" | "difficulty" | "checking" | "language";
export type ConversationGoal = {
    id: ConversationGoalId;
    fields: UserEditableSpecKey[];
};
export declare const DEFAULT_GOALS: ConversationGoal[];
export declare function selectNextGoal(args: {
    spec: SpecDraft;
    gaps: SpecGaps;
    commitments?: CommitmentStore | null | undefined;
}): ConversationGoalId | null;
//# sourceMappingURL=conversationGoals.d.ts.map