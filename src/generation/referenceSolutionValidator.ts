import { runJudge } from "../judge";
import type { GeneratedProblemDraft } from "../contracts/problem";

export class ReferenceSolutionValidationError extends Error {
  judgeStdout: string;
  judgeStderr: string;

  constructor(message: string, opts: { stdout: string; stderr: string }) {
    super(message);
    this.name = "ReferenceSolutionValidationError";
    this.judgeStdout = opts.stdout;
    this.judgeStderr = opts.stderr;
  }
}

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

  const stdoutLower = (result.stdout || "").toLowerCase();
  const stderrLower = (result.stderr || "").toLowerCase();
  const combinedLower = `${stdoutLower}\n${stderrLower}`;

  // Check for compile errors
  const hasCompileError =
    /\berror:|cannot find symbol|class, interface, or enum expected/.test(combinedLower);

  if (hasCompileError) {
    const snippet = `${result.stderr || result.stdout || ""}`.slice(0, 1200);
    throw new ReferenceSolutionValidationError(
      `Reference solution failed to compile for "${draft.title}": ${snippet}`,
      { stdout: result.stdout, stderr: result.stderr }
    );
  }

  // Check that tests pass
  // Note: judge.ts currently sets success: !stderr, which may be fragile.
  // For now, accept success === true as "tests passed".
  if (!result.success) {
    const snippet = `${result.stderr || result.stdout || ""}`.slice(0, 1200);
    throw new ReferenceSolutionValidationError(
      `Reference solution failed tests for "${draft.title}": ${snippet}`,
      { stdout: result.stdout, stderr: result.stderr }
    );
  }

  // Success: reference solution compiles and passes all tests.
  // Caller must discard reference_solution before persistence.
}
