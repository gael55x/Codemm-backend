"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitySpecDraftSchema = void 0;
exports.ensureFixedFields = ensureFixedFields;
exports.validatePatchedSpecOrError = validatePatchedSpecOrError;
exports.isSpecCompleteForGeneration = isSpecCompleteForGeneration;
const zod_1 = require("zod");
const activitySpec_1 = require("../contracts/activitySpec");
const profiles_1 = require("../languages/profiles");
/**
 * Draft validator: allows partial specs during DRAFT/CLARIFYING,
 * but enforces immediate local correctness for any fields that are present.
 */
exports.ActivitySpecDraftSchema = zod_1.z
    .object({
    version: zod_1.z.literal("1.0").optional(),
    language: activitySpec_1.ActivityLanguageSchema.optional(),
    problem_count: zod_1.z.number().int().min(1).max(7).optional(),
    difficulty_plan: activitySpec_1.DifficultyPlanSchema.optional(),
    topic_tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(40)).min(1).max(12).optional(),
    problem_style: zod_1.z.string().trim().min(1).max(64).optional(),
    constraints: zod_1.z.string().trim().min(1).max(2000).optional(),
    test_case_count: zod_1.z.literal(activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT).optional(),
})
    .strict()
    .superRefine((spec, ctx) => {
    if (spec.problem_count != null && spec.difficulty_plan != null) {
        const planSum = spec.difficulty_plan.reduce((sum, p) => sum + p.count, 0);
        if (planSum !== spec.problem_count) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["difficulty_plan"],
                message: `difficulty_plan counts must sum to problem_count (${spec.problem_count}). Got ${planSum}.`,
            });
        }
    }
    if (spec.constraints != null && spec.language != null) {
        const expected = activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[spec.language];
        if (spec.constraints !== expected) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["constraints"],
                message: `constraints must be exactly "${expected}" for language "${spec.language}".`,
            });
        }
    }
});
function ensureFixedFields(spec) {
    const patch = [];
    if (spec.test_case_count !== activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT) {
        patch.push({
            op: spec.test_case_count == null ? "add" : "replace",
            path: "/test_case_count",
            value: activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT,
        });
    }
    if (spec.version !== "1.0") {
        patch.push({ op: spec.version == null ? "add" : "replace", path: "/version", value: "1.0" });
    }
    const language = spec.language ?? "java";
    const expectedConstraints = activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[language];
    if (spec.constraints !== expectedConstraints) {
        patch.push({
            op: spec.constraints == null ? "add" : "replace",
            path: "/constraints",
            value: expectedConstraints,
        });
    }
    return patch;
}
function validatePatchedSpecOrError(patched) {
    const res = exports.ActivitySpecDraftSchema.safeParse(patched);
    if (res.success)
        return null;
    const first = res.error.issues[0];
    return first ? first.message : "Invalid ActivitySpec.";
}
function isSpecCompleteForGeneration(spec) {
    // This is used as a "compiler gate": complete + product-support.
    const parsed = activitySpec_1.ActivitySpecSchema.safeParse(spec);
    if (!parsed.success)
        return false;
    return (0, profiles_1.isLanguageSupportedForGeneration)(parsed.data.language);
}
//# sourceMappingURL=specDraft.js.map