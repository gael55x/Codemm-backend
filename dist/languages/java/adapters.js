"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.javaJudgeAdapter = exports.javaExecutionAdapter = void 0;
const run_1 = require("./run");
const judge_1 = require("./judge");
exports.javaExecutionAdapter = {
    run: async (req) => {
        if (req.kind === "files") {
            const opts = {
                files: req.files,
            };
            if (typeof req.mainClass === "string" && req.mainClass.trim()) {
                opts.mainClass = req.mainClass.trim();
            }
            if (typeof req.stdin === "string") {
                opts.stdin = req.stdin;
            }
            return (0, run_1.runJavaFiles)(opts);
        }
        return (0, run_1.runJavaCodeOnly)(req.code, req.stdin);
    },
};
exports.javaJudgeAdapter = {
    judge: async (req) => {
        if (req.kind === "files") {
            return (0, judge_1.runJavaJudgeFiles)(req.files, req.testSuite);
        }
        return (0, judge_1.runJavaJudge)(req.code, req.testSuite);
    },
};
//# sourceMappingURL=adapters.js.map