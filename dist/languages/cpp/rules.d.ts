import { z } from "zod";
export declare const CppSourceSchema: z.ZodEffects<z.ZodString, string, string>;
export type CppTestSuiteDiagnostics = {
    includesSolutionCpp: boolean;
    hasMain: boolean;
    hasRunTestCalls: boolean;
    hasVariadicRunTestMacro: boolean;
    hasPassFailOutput: boolean;
    foundTestNumbers: number[];
};
export declare function diagnoseCppTestSuite(testSuite: string, testCount: number): CppTestSuiteDiagnostics;
export declare function isValidCppTestSuite(testSuite: string, testCount: number): boolean;
//# sourceMappingURL=rules.d.ts.map