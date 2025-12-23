import type { JudgeResult } from "../../types";
export type CppFiles = Record<string, string>;
export declare function runCppJudge(userCode: string, testSuite: string): Promise<JudgeResult>;
export declare function runCppJudgeFiles(userFiles: CppFiles, testSuite: string): Promise<JudgeResult>;
//# sourceMappingURL=judge.d.ts.map