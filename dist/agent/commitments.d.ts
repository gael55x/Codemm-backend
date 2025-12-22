import type { ActivitySpec } from "../contracts/activitySpec";
export type Commitment = {
    field: keyof ActivitySpec;
    value: unknown;
    confidence: number;
    source: "explicit" | "implicit";
    locked: boolean;
};
export type CommitmentStore = Partial<Record<keyof ActivitySpec, Commitment>>;
export declare function parseCommitmentsJson(json: string | null | undefined): CommitmentStore;
export declare function serializeCommitments(store: CommitmentStore): string;
export declare function listCommitments(store: CommitmentStore): Commitment[];
export declare function isFieldLocked(store: CommitmentStore, field: keyof ActivitySpec): boolean;
export declare function shouldLockCommitment(field: keyof ActivitySpec, confidence: number, source: Commitment["source"]): boolean;
export declare function upsertCommitment(store: CommitmentStore, next: Omit<Commitment, "locked">): CommitmentStore;
export declare function removeCommitment(store: CommitmentStore, field: keyof ActivitySpec): CommitmentStore;
//# sourceMappingURL=commitments.d.ts.map