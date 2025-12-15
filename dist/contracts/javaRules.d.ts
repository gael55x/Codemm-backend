import { z } from "zod";
export declare const JavaSourceNoPackageSchema: z.ZodEffects<z.ZodString, string, string>;
export declare function countJUnitTests(testSuite: string): number;
export declare function hasJUnit5Imports(testSuite: string): boolean;
export declare function hasNonTrivialAssertions(testSuite: string): boolean;
export declare function isValidJUnit5TestSuite(testSuite: string, expectedTestCount: number): boolean;
//# sourceMappingURL=javaRules.d.ts.map