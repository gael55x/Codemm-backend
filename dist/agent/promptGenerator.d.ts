import type { SpecDraft } from "../compiler/specDraft";
import type { ConfidenceMap, ReadinessResult } from "./readiness";
import type { DialogueUpdate } from "./dialogue";
import type { CommitmentStore } from "./commitments";
export declare function generateNextPrompt(args: {
    spec: SpecDraft;
    readiness: ReadinessResult;
    confidence?: ConfidenceMap | null;
    commitments?: CommitmentStore | null;
    lastUserMessage: string;
    dialogueUpdate?: DialogueUpdate | null;
}): string;
//# sourceMappingURL=promptGenerator.d.ts.map