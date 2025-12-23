"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cppJudgeAdapter = exports.cppExecutionAdapter = void 0;
const run_1 = require("./run");
const judge_1 = require("./judge");
exports.cppExecutionAdapter = {
    run: async (req) => {
        if (req.kind === "files") {
            return (0, run_1.runCppFiles)({
                files: req.files,
                ...(typeof req.stdin === "string" ? { stdin: req.stdin } : {}),
            });
        }
        return (0, run_1.runCppCodeOnly)(req.code, req.stdin);
    },
};
exports.cppJudgeAdapter = {
    judge: async (req) => {
        if (req.kind === "files") {
            return (0, judge_1.runCppJudgeFiles)(req.files, req.testSuite);
        }
        return (0, judge_1.runCppJudge)(req.code, req.testSuite);
    },
};
//# sourceMappingURL=adapters.js.map