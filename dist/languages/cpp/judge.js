"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCppJudge = runCppJudge;
exports.runCppJudgeFiles = runCppJudgeFiles;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const trace_1 = require("../../utils/trace");
const exec_1 = require("../../judge/exec");
function parseCppRunner(stdout) {
    const clean = (0, exec_1.stripAnsi)(stdout);
    const passed = new Set();
    const failed = new Set();
    const re = /^\s*\[(PASS|FAIL)\]\s+(test_case_[A-Za-z0-9_]+)\b/gm;
    let m;
    while ((m = re.exec(clean)) !== null) {
        const status = m[1];
        const name = m[2];
        if (!status || !name)
            continue;
        if (status === "PASS")
            passed.add(name);
        if (status === "FAIL")
            failed.add(name);
    }
    return { passed: Array.from(passed), failed: Array.from(failed) };
}
async function runCppJudge(userCode, testSuite) {
    return runCppJudgeFiles({ "solution.cpp": userCode }, testSuite);
}
async function runCppJudgeFiles(userFiles, testSuite) {
    const start = Date.now();
    const tmp = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "codem-cpp-judge-"));
    try {
        for (const [filename, source] of Object.entries(userFiles)) {
            (0, fs_1.writeFileSync)((0, path_1.join)(tmp, filename), source, "utf8");
        }
        const testFilename = "test.cpp";
        if (Object.prototype.hasOwnProperty.call(userFiles, testFilename)) {
            const executionTimeMs = Date.now() - start;
            return {
                success: false,
                passedTests: [],
                failedTests: [],
                stdout: "",
                stderr: `User files include "${testFilename}", which conflicts with the test suite filename.`,
                executionTimeMs,
            };
        }
        (0, fs_1.writeFileSync)((0, path_1.join)(tmp, testFilename), testSuite, "utf8");
        const compileCmd = "g++ -std=c++20 -O2 -pipe -Wall -Wextra -Wno-unused-parameter -o /tmp/test /workspace/test.cpp";
        const runCmd = "/tmp/test";
        const dockerCmd = [
            "docker run --rm",
            "--network none",
            "--read-only",
            "--tmpfs /tmp:rw",
            `-v ${tmp}:/workspace:ro`,
            "--workdir /workspace",
            "--entrypoint /bin/bash",
            "codem-cpp-judge",
            `-lc \"${compileCmd} && ${runCmd}\"`,
        ].join(" ");
        const { stdout, stderr, exitCode, timedOut } = await (0, exec_1.execAsync)(dockerCmd, tmp);
        (0, trace_1.trace)("judge.result", { exitCode, timedOut, stdoutLen: stdout.length, stderrLen: stderr.length });
        const executionTimeMs = Date.now() - start;
        const { passed, failed } = parseCppRunner(stdout);
        return {
            success: exitCode === 0,
            passedTests: passed,
            failedTests: failed,
            stdout,
            stderr,
            executionTimeMs,
            exitCode,
            timedOut,
        };
    }
    catch (e) {
        const executionTimeMs = Date.now() - start;
        return {
            success: false,
            passedTests: [],
            failedTests: [],
            stdout: e?.stdout ?? "",
            stderr: e?.stderr ?? String(e?.error ?? e),
            executionTimeMs,
        };
    }
    finally {
        (0, fs_1.rmSync)(tmp, { recursive: true, force: true });
    }
}
//# sourceMappingURL=judge.js.map