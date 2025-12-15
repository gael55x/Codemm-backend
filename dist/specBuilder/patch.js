"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyJsonPatch = applyJsonPatch;
function applyJsonPatch(obj, patch) {
    // Minimal safe patcher: only allows top-level JSON pointer paths like "/language".
    const next = { ...obj };
    for (const op of patch) {
        if (!op.path.startsWith("/")) {
            throw new Error(`Invalid JSON Patch path: ${op.path}`);
        }
        const parts = op.path.split("/").slice(1);
        if (parts.length !== 1) {
            throw new Error(`Only top-level patch paths are supported. Got: ${op.path}`);
        }
        const key = decodeURIComponent(parts[0] ?? "");
        if (!key) {
            throw new Error(`Invalid JSON Patch path: ${op.path}`);
        }
        switch (op.op) {
            case "add":
            case "replace":
                next[key] = op.value;
                break;
            case "remove":
                delete next[key];
                break;
            default:
                throw new Error(`Unsupported JSON Patch op: ${op.op}`);
        }
    }
    return next;
}
//# sourceMappingURL=patch.js.map