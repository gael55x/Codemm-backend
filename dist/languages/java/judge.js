"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJavaJudge = runJavaJudge;
exports.runJavaJudgeFiles = runJavaJudgeFiles;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const trace_1 = require("../../utils/trace");
const exec_1 = require("../../judge/exec");
function parseJUnitTree(stdout) {
    const clean = (0, exec_1.stripAnsi)(stdout);
    const passed = [];
    const failed = [];
    const seen = new Set();
    for (const line of clean.split(/\r?\n/)) {
        // Example:
        // |   +-- testNamesWithNumbers() [OK]
        // |   +-- testNamesWithSpaces() [X] expected: <...>
        const m = line.match(/\b([A-Za-z_][A-Za-z0-9_]*)\(\)\s+\[(OK|X)\]\b/);
        if (!m)
            continue;
        const name = m[1];
        const status = m[2];
        if (seen.has(`${name}:${status}`))
            continue;
        seen.add(`${name}:${status}`);
        if (status === "OK")
            passed.push(name);
        if (status === "X")
            failed.push(name);
    }
    return { passed, failed };
}
function inferClassName(source, fallback) {
    const match = source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    return match && match[1] ? match[1] : fallback;
}
async function runJavaJudge(userCode, testSuite) {
    const start = Date.now();
    const tmp = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "codem-judge-"));
    try {
        const userClassName = inferClassName(userCode, "Solution");
        const testClassName = inferClassName(testSuite, `${userClassName}Test`);
        (0, fs_1.writeFileSync)((0, path_1.join)(tmp, `${userClassName}.java`), userCode, "utf8");
        (0, fs_1.writeFileSync)((0, path_1.join)(tmp, `${testClassName}.java`), testSuite, "utf8");
        const dockerCmd = ["docker run --rm", `-v ${tmp}:/workspace`, "codem-java-judge"].join(" ");
        const { stdout, stderr, exitCode, timedOut } = await (0, exec_1.execAsync)(dockerCmd, tmp);
        (0, trace_1.trace)("judge.result", { exitCode, timedOut, stdoutLen: stdout.length, stderrLen: stderr.length });
        const executionTimeMs = Date.now() - start;
        const { passed, failed } = parseJUnitTree(stdout);
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
async function runJavaJudgeFiles(userFiles, testSuite) {
    const start = Date.now();
    const tmp = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "codem-judge-"));
    try {
        for (const [filename, source] of Object.entries(userFiles)) {
            (0, fs_1.writeFileSync)((0, path_1.join)(tmp, filename), source, "utf8");
        }
        const testClassName = inferClassName(testSuite, "UserTest");
        const testFilename = `${testClassName}.java`;
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
        const dockerCmd = ["docker run --rm", `-v ${tmp}:/workspace`, "codem-java-judge"].join(" ");
        const { stdout, stderr, exitCode, timedOut } = await (0, exec_1.execAsync)(dockerCmd, tmp);
        (0, trace_1.trace)("judge.result", { exitCode, timedOut, stdoutLen: stdout.length, stderrLen: stderr.length });
        const executionTimeMs = Date.now() - start;
        const { passed, failed } = parseJUnitTree(stdout);
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