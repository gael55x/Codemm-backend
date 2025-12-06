"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJudge = runJudge;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
function execAsync(command, cwd) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, {
            cwd,
            timeout: 2000,
            maxBuffer: 256 * 1024,
        }, (error, stdout, stderr) => {
            if (error) {
                return reject({ error, stdout, stderr });
            }
            resolve({ stdout, stderr });
        });
    });
}
async function runJudge(userCode, testSuite) {
    const start = Date.now();
    const tmp = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "codem-judge-"));
    try {
        // For now we simply write two files; Docker integration will mount this directory.
        (0, fs_1.writeFileSync)((0, path_1.join)(tmp, "Solution.java"), userCode, "utf8");
        (0, fs_1.writeFileSync)((0, path_1.join)(tmp, "SolutionTest.java"), testSuite, "utf8");
        // This assumes a Docker image named codem-java-judge is available.
        const dockerCmd = [
            "docker run --rm",
            `-v ${tmp}:/workspace`,
            "codem-java-judge",
        ].join(" ");
        const { stdout, stderr } = await execAsync(dockerCmd, tmp);
        const executionTimeMs = Date.now() - start;
        // TODO: parse stdout/stderr to determine passed/failed test names.
        return {
            success: !stderr,
            passedTests: [],
            failedTests: [],
            stdout,
            stderr,
            executionTimeMs,
        };
    }
    catch (e) {
        const executionTimeMs = Date.now() - start;
        return {
            success: false,
            passedTests: [],
            failedTests: [],
            stdout: e.stdout ?? "",
            stderr: e.stderr ?? String(e.error ?? e),
            executionTimeMs,
        };
    }
    finally {
        (0, fs_1.rmSync)(tmp, { recursive: true, force: true });
    }
}
//# sourceMappingURL=judge.js.map