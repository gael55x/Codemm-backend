import type { JudgeResult } from "../../types";
export type PythonFiles = Record<string, string>;
export declare function runPythonJudge(userCode: string, testSuite: string): Promise<JudgeResult>;
export declare function runPythonJudgeFiles(userFiles: PythonFiles, testSuite: string): Promise<JudgeResult>;
//# sourceMappingURL=judge.d.ts.map