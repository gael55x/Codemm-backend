import type { ActivitySpec } from "../contracts/activitySpec";
import type { SpecDraft } from "../compiler/specDraft";
import { analyzeSpecGaps } from "./specAnalysis";
import type { CommitmentStore } from "./commitments";
export type ConfidenceMap = Record<string, number>;
export declare const REQUIRED_CONFIDENCE: Partial<Record<keyof ActivitySpec, number>>;
export type ReadinessResult = {
    ready: boolean;
    gaps: ReturnType<typeof analyzeSpecGaps>;
    minConfidence: number;
    lowConfidenceFields: (keyof ActivitySpec)[];
};
export declare function computeReadiness(spec: SpecDraft, confidence: ConfidenceMap | null | undefined, commitments?: CommitmentStore | null): ReadinessResult;
//# sourceMappingURL=readiness.d.ts.map