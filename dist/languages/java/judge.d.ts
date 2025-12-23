import type { JudgeResult } from "../../types";
export type JavaFiles = Record<string, string>;
export declare function runJavaJudge(userCode: string, testSuite: string): Promise<JudgeResult>;
export declare function runJavaJudgeFiles(userFiles: JavaFiles, testSuite: string): Promise<JudgeResult>;
//# sourceMappingURL=judge.d.ts.map