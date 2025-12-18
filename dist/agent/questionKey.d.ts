import type { SpecDraft } from "../specBuilder/validators";
import { type ConfidenceMap } from "./readiness";
/**
 * Stable identifier for "what question are we currently trying to answer?"
 * Used to decide whether to keep buffering messages or reset the buffer.
 */
export declare function getDynamicQuestionKey(spec: SpecDraft, confidence: ConfidenceMap | null | undefined): string | null;
//# sourceMappingURL=questionKey.d.ts.map