import { z } from "zod";
import { JavaSourceNoPackageSchema, isValidJUnit5TestSuite } from "./javaRules";

/**
 * Codemm v1.0 Generation output contract for Java problems.
 *
 * NOTE: reference_solution is required at generation time, validated in Docker,
 * then discarded and MUST NOT be persisted.
 */
export const GeneratedProblemDraftSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(8000),

    // Starter code the learner edits.
    starter_code: JavaSourceNoPackageSchema,

    // Exactly 8 tests, non-trivial assertions, JUnit 5 imports, no package.
    test_suite: z
      .string()
      .min(1)
      .superRefine((ts, ctx) => {
        if (!isValidJUnit5TestSuite(ts, 8)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Invalid test_suite: must have exactly 8 @Test methods, JUnit 5 imports, no package, and non-trivial assertions.",
          });
        }
      }),

    // Hidden solution used ONLY for validation.
    reference_solution: JavaSourceNoPackageSchema,

    constraints: z.string().trim().min(1).max(2000),

    sample_inputs: z.array(z.string()).max(20),
    sample_outputs: z.array(z.string()).max(20),

    // Planned metadata (derived from ProblemPlan, not user chat).
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic_tag: z.string().trim().min(1).max(40),
  })
  .strict();

export type GeneratedProblemDraft = z.infer<typeof GeneratedProblemDraftSchema>;

/**
 * Persisted problem shape (reference_solution intentionally omitted).
 */
export const GeneratedProblemSchema = GeneratedProblemDraftSchema.omit({
  reference_solution: true,
});

export type GeneratedProblem = z.infer<typeof GeneratedProblemSchema>;
