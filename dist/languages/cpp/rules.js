"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppSourceSchema = void 0;
exports.diagnoseCppTestSuite = diagnoseCppTestSuite;
exports.isValidCppTestSuite = isValidCppTestSuite;
const zod_1 = require("zod");
function stripCppComments(source) {
    const withoutBlock = source.replace(/\/\*[\s\S]*?\*\//g, "");
    return withoutBlock.replace(/\/\/.*$/gm, "");
}
exports.CppSourceSchema = zod_1.z
    .string()
    .min(1)
    .superRefine((source, ctx) => {
    const s = stripCppComments(source);
    if (/\bint\s+main\s*\(/.test(s)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'C++ source must not define "main()"; grading uses a separate test runner.',
        });
    }
    if (!/\bsolve\s*\(/.test(s)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'C++ source must define a solve(...) function.',
        });
    }
});
function diagnoseCppTestSuite(testSuite, testCount) {
    const s = stripCppComments(testSuite ?? "");
    const includesSolutionCpp = /#\s*include\s+"solution\.cpp"/.test(s);
    const hasMain = /\bint\s+main\s*\(/.test(s);
    const found = new Set();
    const collect = (re) => {
        let m;
        while ((m = re.exec(s)) !== null) {
            const n = Number(m[1]);
            if (Number.isFinite(n))
                found.add(n);
        }
    };
    // Primary: macro style.
    collect(/\bRUN_TEST\s*\(\s*"test_case_(\d+)"\s*(?:,|\))/g);
    // Fallback: function-based runner style.
    if (found.size === 0) {
        collect(/\brun\s*\(\s*"test_case_(\d+)"\s*(?:,|\))/g);
    }
    // Last resort: function definitions only.
    if (found.size === 0) {
        collect(/\b(?:void|bool|int)\s+test_case_(\d+)\s*\(/g);
    }
    const foundTestNumbers = Array.from(found).sort((a, b) => a - b);
    const hasAllTests = found.size === testCount && Array.from({ length: testCount }, (_, i) => i + 1).every((n) => found.has(n));
    // If using RUN_TEST, require it to be variadic to avoid comma parsing failures.
    const hasRunTestCalls = /\bRUN_TEST\s*\(/.test(s);
    const hasVariadicRunTestMacro = !hasRunTestCalls
        ? true
        : /^\s*#\s*define\s+RUN_TEST\s*\([^)]*\.\.\.[^)]*\)/m.test(s);
    // Ensure the runner prints parseable status lines.
    const hasPassFailOutput = /\[(PASS|FAIL)\]/.test(s);
    return {
        includesSolutionCpp,
        hasMain,
        hasRunTestCalls,
        hasVariadicRunTestMacro,
        hasPassFailOutput,
        foundTestNumbers,
    };
}
function isValidCppTestSuite(testSuite, testCount) {
    const d = diagnoseCppTestSuite(testSuite, testCount);
    const hasAllTests = d.foundTestNumbers.length === testCount &&
        Array.from({ length: testCount }, (_, i) => i + 1).every((n) => d.foundTestNumbers.includes(n));
    return (d.includesSolutionCpp &&
        d.hasMain &&
        hasAllTests &&
        d.hasVariadicRunTestMacro &&
        d.hasPassFailOutput);
}
//# sourceMappingURL=rules.js.map