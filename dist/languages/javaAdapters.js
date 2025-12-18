"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.javaJudgeAdapter = exports.javaExecutionAdapter = void 0;
const javaRun_1 = require("../execution/javaRun");
const judge_1 = require("../judge");
exports.javaExecutionAdapter = {
    run: async (req) => {
        if (req.kind === "files") {
            const opts = { files: req.files };
            if (typeof req.mainClass === "string" && req.mainClass.trim()) {
                opts.mainClass = req.mainClass.trim();
            }
            return (0, javaRun_1.runJavaFiles)(opts);
        }
        return (0, javaRun_1.runJavaCodeOnly)(req.code);
    },
};
exports.javaJudgeAdapter = {
    judge: async (req) => {
        if (req.kind === "files") {
            return (0, judge_1.runJudgeFiles)(req.files, req.testSuite);
        }
        return (0, judge_1.runJudge)(req.code, req.testSuite);
    },
};
//# sourceMappingURL=javaAdapters.js.map