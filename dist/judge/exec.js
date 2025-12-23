"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJudgeTimeoutMs = getJudgeTimeoutMs;
exports.stripAnsi = stripAnsi;
exports.execAsync = execAsync;
const child_process_1 = require("child_process");
function getJudgeTimeoutMs() {
    const raw = process.env.JUDGE_TIMEOUT_MS;
    if (!raw)
        return 15000;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
        return 15000;
    return Math.min(Math.floor(n), 30000);
}
function stripAnsi(text) {
    return text.replace(/\u001b\[[0-9;]*m/g, "");
}
function execAsync(command, cwd) {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(command, {
            cwd,
            timeout: getJudgeTimeoutMs(),
            maxBuffer: 1024 * 1024,
        }, (error, stdout, stderr) => {
            const exitCode = error && typeof error.code === "number" ? error.code : error ? 1 : 0;
            const timedOutByNode = Boolean(error?.killed) &&
                Boolean(error?.signal) &&
                (error?.code == null);
            const timedOutByExit = exitCode === 137 || exitCode === 143;
            const timedOut = timedOutByNode || timedOutByExit;
            resolve({ stdout, stderr, exitCode, timedOut });
        });
    });
}
//# sourceMappingURL=exec.js.map