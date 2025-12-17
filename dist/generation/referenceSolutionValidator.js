"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceSolutionValidationError = void 0;
exports.validateReferenceSolution = validateReferenceSolution;
const judge_1 = require("../judge");
class ReferenceSolutionValidationError extends Error {
    constructor(message, opts) {
        super(message);
        this.name = "ReferenceSolutionValidationError";
        this.judgeStdout = opts.stdout;
        this.judgeStderr = opts.stderr;
    }
}
exports.ReferenceSolutionValidationError = ReferenceSolutionValidationError;
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
async function validateReferenceSolution(draft) {
    const result = await (0, judge_1.runJudge)(draft.reference_solution, draft.test_suite);
    const stdoutLower = (result.stdout || "").toLowerCase();
    const stderrLower = (result.stderr || "").toLowerCase();
    const combinedLower = `${stdoutLower}\n${stderrLower}`;
    // Check for compile errors
    const hasCompileError = /\berror:|cannot find symbol|class, interface, or enum expected/.test(combinedLower);
    if (hasCompileError) {
        const snippet = `${result.stderr || result.stdout || ""}`.slice(0, 1200);
        throw new ReferenceSolutionValidationError(`Reference solution failed to compile for "${draft.title}": ${snippet}`, { stdout: result.stdout, stderr: result.stderr });
    }
    // Check that tests pass
    // Note: judge.ts currently sets success: !stderr, which may be fragile.
    // For now, accept success === true as "tests passed".
    if (!result.success) {
        const snippet = `${result.stderr || result.stdout || ""}`.slice(0, 1200);
        throw new ReferenceSolutionValidationError(`Reference solution failed tests for "${draft.title}": ${snippet}`, { stdout: result.stdout, stderr: result.stderr });
    }
    // Success: reference solution compiles and passes all tests.
    // Caller must discard reference_solution before persistence.
}
//# sourceMappingURL=referenceSolutionValidator.js.map