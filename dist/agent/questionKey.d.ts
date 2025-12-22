import type { SpecDraft } from "../compiler/specDraft";
import { type ConfidenceMap } from "./readiness";
import type { CommitmentStore } from "./commitments";
/**
 * Stable identifier for "what question are we currently trying to answer?"
 * Used to decide whether to keep buffering messages or reset the buffer.
 */
export declare function getDynamicQuestionKey(spec: SpecDraft, confidence: ConfidenceMap | null | undefined, commitments?: CommitmentStore | null): string | null;
//# sourceMappingURL=questionKey.d.ts.map