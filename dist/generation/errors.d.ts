import type { GenerationOutcome } from "../contracts/generationOutcome";
export type GenerationFailureKind = "compile" | "tests" | "timeout" | "contract" | "llm" | "unknown";
export declare class GenerationContractError extends Error {
    slotIndex: number;
    llmOutputHash: string | undefined;
    rawSnippet: string | undefined;
    constructor(message: string, opts: {
        slotIndex: number;
        llmOutputHash?: string;
        rawSnippet?: string;
    });
}
export declare class GenerationSlotFailureError extends Error {
    slotIndex: number;
    kind: GenerationFailureKind;
    attempts: number;
    title: string | undefined;
    llmOutputHash: string | undefined;
    outcomesSoFar: GenerationOutcome[] | undefined;
    constructor(message: string, opts: {
        slotIndex: number;
        kind: GenerationFailureKind;
        attempts: number;
        title?: string;
        llmOutputHash?: string;
        outcomesSoFar?: GenerationOutcome[];
    });
}
//# sourceMappingURL=errors.d.ts.map