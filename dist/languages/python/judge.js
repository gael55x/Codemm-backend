"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPythonJudge = runPythonJudge;
exports.runPythonJudgeFiles = runPythonJudgeFiles;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const trace_1 = require("../../utils/trace");
const exec_1 = require("../../judge/exec");
function parsePytestFailures(output) {
    const failed = new Set();
    const errored = new Set();
    const lines = (0, exec_1.stripAnsi)(output).split(/\r?\n/);
    for (const line of lines) {
        let m = line.match(/\bFAILED\s+[^:]+::(test_[A-Za-z0-9_]+)\b/);
        if (m?.[1])
            failed.add(m[1]);
        m = line.match(/\bERROR\s+[^:]+::(test_[A-Za-z0-9_]+)\b/);
        if (m?.[1])
            errored.add(m[1]);
    }
    return { failed: Array.from(failed), errored: Array.from(errored) };
}
function inferPytestTestNames(testSuite) {
    const names = [];
    const re = /^\s*def\s+(test_[A-Za-z0-9_]+)\s*\(/gm;
    let m;
    while ((m = re.exec(testSuite)) !== null) {
        if (m[1])
            names.push(m[1]);
    }
    return Array.from(new Set(names));
}
async function runPythonJudge(userCode, testSuite) {
    return runPythonJudgeFiles({ "solution.py": userCode }, testSuite);
}
async function runPythonJudgeFiles(userFiles, testSuite) {
    const start = Date.now();
    const tmp = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "codem-py-judge-"));
    try {
        for (const [filename, source] of Object.entries(userFiles)) {
            (0, fs_1.writeFileSync)((0, path_1.join)(tmp, filename), source, "utf8");
        }
        const testFilename = "test_solution.py";
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
        const dockerCmd = [
            "docker run --rm",
            "--network none",
            "--read-only",
            "--tmpfs /tmp:rw",
            "-e PYTHONDONTWRITEBYTECODE=1",
            "-e PYTHONHASHSEED=0",
            "-e PYTHONUNBUFFERED=1",
            "-e PYTEST_DISABLE_PLUGIN_AUTOLOAD=1",
            `-v ${tmp}:/workspace:ro`,
            "--workdir /workspace",
            "codem-python-judge",
        ].join(" ");
        const { stdout, stderr, exitCode, timedOut } = await (0, exec_1.execAsync)(dockerCmd, tmp);
        (0, trace_1.trace)("judge.result", { exitCode, timedOut, stdoutLen: stdout.length, stderrLen: stderr.length });
        const executionTimeMs = Date.now() - start;
        if (exitCode === 0) {
            const inferred = inferPytestTestNames(testSuite);
            return {
                success: true,
                passedTests: inferred,
                failedTests: [],
                stdout,
                stderr,
                executionTimeMs,
                exitCode,
                timedOut,
            };
        }
        const { failed, errored } = parsePytestFailures(stdout + "\n" + stderr);
        const inferred = inferPytestTestNames(testSuite);
        const failing = Array.from(new Set([...failed, ...errored]));
        const passedTests = inferred.filter((t) => !failing.includes(t));
        return {
            success: false,
            passedTests,
            failedTests: failing,
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