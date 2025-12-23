export declare function getJudgeTimeoutMs(): number;
export declare function stripAnsi(text: string): string;
export declare function execAsync(command: string, cwd: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
}>;
//# sourceMappingURL=exec.d.ts.map