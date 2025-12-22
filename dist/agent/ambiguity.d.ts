import type { ActivitySpec } from "../contracts/activitySpec";
import { type ConfidenceMap } from "./readiness";
export declare enum AmbiguityRisk {
    SAFE = "SAFE",
    DEFERABLE = "DEFERABLE",
    BLOCKING = "BLOCKING"
}
export declare const BLOCKING_CONFIDENCE: Partial<Record<keyof ActivitySpec, number>>;
export declare function getConfidence(confidence: ConfidenceMap | null | undefined, key: keyof ActivitySpec): number;
export declare function classifyAmbiguityRisk(field: keyof ActivitySpec, confidence: number): AmbiguityRisk;
//# sourceMappingURL=ambiguity.d.ts.map