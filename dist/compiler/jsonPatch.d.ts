export type JsonPatchOp = {
    op: "add";
    path: string;
    value: unknown;
} | {
    op: "replace";
    path: string;
    value: unknown;
} | {
    op: "remove";
    path: string;
};
export declare function applyJsonPatch<T extends Record<string, any>>(obj: T, patch: JsonPatchOp[]): T;
//# sourceMappingURL=jsonPatch.d.ts.map