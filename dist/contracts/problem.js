"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedProblemSchema = exports.GeneratedProblemDraftSchema = void 0;
const zod_1 = require("zod");
const javaRules_1 = require("./javaRules");
/**
 * Codemm v1.0 Generation output contract for Java problems.
 *
 * NOTE: reference_solution is required at generation time, validated in Docker,
 * then discarded and MUST NOT be persisted.
 */
exports.GeneratedProblemDraftSchema = zod_1.z
    .object({
    id: zod_1.z.string().trim().min(1).max(80),
    title: zod_1.z.string().trim().min(1).max(120),
    description: zod_1.z.string().trim().min(1).max(8000),
    // Starter code the learner edits.
    starter_code: javaRules_1.JavaSourceNoPackageSchema,
    // Exactly 8 tests, non-trivial assertions, JUnit 5 imports, no package.
    test_suite: zod_1.z
        .string()
        .min(1)
        .superRefine((ts, ctx) => {
        if (!(0, javaRules_1.isValidJUnit5TestSuite)(ts, 8)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Invalid test_suite: must have exactly 8 @Test methods, JUnit 5 imports, no package, and non-trivial assertions.",
            });
        }
    }),
    // Hidden solution used ONLY for validation.
    reference_solution: javaRules_1.JavaSourceNoPackageSchema,
    constraints: zod_1.z.string().trim().min(1).max(2000),
    sample_inputs: zod_1.z.array(zod_1.z.string()).max(20),
    sample_outputs: zod_1.z.array(zod_1.z.string()).max(20),
    // Planned metadata (derived from ProblemPlan, not user chat).
    difficulty: zod_1.z.enum(["easy", "medium", "hard"]),
    topic_tag: zod_1.z.string().trim().min(1).max(40),
})
    .strict();
/**
 * Persisted problem shape (reference_solution intentionally omitted).
 */
exports.GeneratedProblemSchema = exports.GeneratedProblemDraftSchema.omit({
    reference_solution: true,
});
//# sourceMappingURL=problem.js.map