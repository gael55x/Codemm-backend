"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSchema = exports.SessionMessageSchema = exports.SessionMessageRoleSchema = exports.SessionStateSchema = void 0;
exports.canTransition = canTransition;
exports.assertCanTransition = assertCanTransition;
const zod_1 = require("zod");
const activitySpec_1 = require("./activitySpec");
exports.SessionStateSchema = zod_1.z.enum([
    "DRAFT",
    "CLARIFYING",
    "READY",
    "GENERATING",
    "SAVED",
    "FAILED",
]);
exports.SessionMessageRoleSchema = zod_1.z.enum(["user", "assistant"]);
exports.SessionMessageSchema = zod_1.z
    .object({
    id: zod_1.z.string().uuid(),
    session_id: zod_1.z.string().uuid(),
    role: exports.SessionMessageRoleSchema,
    content: zod_1.z.string().min(1),
    created_at: zod_1.z.string().datetime(),
})
    .strict();
exports.SessionSchema = zod_1.z
    .object({
    id: zod_1.z.string().uuid(),
    state: exports.SessionStateSchema,
    // Authoritative source of truth for generation.
    spec: activitySpec_1.ActivitySpecSchema,
    // Optional extras returned by API.
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
    // Session may or may not be materialized with messages in the DB layer.
    messages: zod_1.z.array(exports.SessionMessageSchema).optional(),
    // The generated activity id when SAVED.
    activity_id: zod_1.z.string().uuid().nullable().optional(),
    // Error info when FAILED.
    last_error: zod_1.z.string().nullable().optional(),
})
    .strict();
// Codemm v1.0 strict state machine
const ALLOWED_TRANSITIONS = {
    DRAFT: ["CLARIFYING"],
    CLARIFYING: ["CLARIFYING", "READY"],
    READY: ["GENERATING"],
    GENERATING: ["SAVED", "FAILED", "READY"],
    SAVED: [],
    FAILED: ["READY"],
};
function canTransition(from, to) {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    return allowed.includes(to);
}
function assertCanTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new Error(`Invalid session state transition: ${from} -> ${to}`);
    }
}
//# sourceMappingURL=session.js.map