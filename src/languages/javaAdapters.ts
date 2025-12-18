import type { ExecutionAdapter, JudgeAdapter } from "./types";
import { runJavaCodeOnly, runJavaFiles } from "../execution/javaRun";
import { runJudge, runJudgeFiles } from "../judge";

export const javaExecutionAdapter: ExecutionAdapter = {
  run: async (req) => {
    if (req.kind === "files") {
      const opts: { files: Record<string, string>; mainClass?: string; stdin?: string } = {
        files: req.files,
      };
      if (typeof req.mainClass === "string" && req.mainClass.trim()) {
        opts.mainClass = req.mainClass.trim();
      }
      if (typeof req.stdin === "string") {
        opts.stdin = req.stdin;
      }
      return runJavaFiles(opts);
    }
    return runJavaCodeOnly(req.code, req.stdin);
  },
};

export const javaJudgeAdapter: JudgeAdapter = {
  judge: async (req) => {
    if (req.kind === "files") {
      return runJudgeFiles(req.files, req.testSuite);
    }
    return runJudge(req.code, req.testSuite);
  },
};
