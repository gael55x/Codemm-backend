import { runJudge } from "../judge";
import type { GeneratedProblemDraft } from "../contracts/problem";

/**
 * Validate that the reference_solution compiles and passes all tests via Docker.
 *
 * Throws on:
 * - Compile errors
 * - Test failures (reference solution must pass all tests)
 *
 * Returns void on success.
 *
 * After this validation passes, the caller MUST discard reference_solution
 * before persisting the problem.
 */
export async function validateReferenceSolution(draft: GeneratedProblemDraft): Promise<void> {
  const result = await runJudge(draft.reference_solution, draft.test_suite);

  const stderrLower = (result.stderr || "").toLowerCase();

  // Check for compile errors
  const hasCompileError = /\berror:|cannot find symbol|class, interface, or enum expected/.test(
    stderrLower
  );

  if (hasCompileError) {
    throw new Error(
      `Reference solution failed to compile for "${draft.title}": ${result.stderr.slice(0, 400)}`
    );
  }

  // Check that tests pass
  // Note: judge.ts currently sets success: !stderr, which may be fragile.
  // For now, accept success === true as "tests passed".
  if (!result.success) {
    throw new Error(
      `Reference solution failed tests for "${draft.title}": ${result.stderr.slice(0, 400)}`
    );
  }

  // Success: reference solution compiles and passes all tests.
  // Caller must discard reference_solution before persistence.
}
