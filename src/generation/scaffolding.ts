import type { GeneratedProblemDraft } from "../contracts/problem";
import type { ProblemSlot } from "../planner/types";
import { getLanguageProfile } from "../languages/profiles";
import { trace } from "../utils/trace";
import { GenerationContractError } from "./errors";

function normalizeScaffoldLevel(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const v = raw <= 1 ? raw : raw / 100;
  return Math.max(0, Math.min(1, v));
}

function buildTodoLines(args: {
  lineComment: string;
  scaffoldLevel: number;
  learningGoal?: string | undefined;
}): string[] {
  const lc = args.lineComment;
  const goal = (args.learningGoal ?? "").trim();
  const goalSuffix = goal ? ` (${goal})` : "";

  // Higher scaffold => more guidance; lower scaffold => terser guidance.
  const lines: string[] = [`${lc} BEGIN STUDENT TODO`];
  if (args.scaffoldLevel >= 0.75) {
    lines.push(`${lc} TODO: Implement the missing core logic${goalSuffix}.`);
    lines.push(`${lc} Hint: Use the problem description as your spec.`);
    lines.push(`${lc} Hint: Let the existing tests drive edge cases.`);
  } else if (args.scaffoldLevel >= 0.45) {
    lines.push(`${lc} TODO: Implement the missing logic${goalSuffix}.`);
    lines.push(`${lc} Hint: Follow the problem description and tests.`);
  } else if (args.scaffoldLevel >= 0.2) {
    lines.push(`${lc} TODO: Implement this${goalSuffix}.`);
  } else {
    lines.push(`${lc} TODO: Implement this.`);
  }
  lines.push(`${lc} END STUDENT TODO`);
  return lines;
}

type JavaMethodBody = {
  name: string;
  openBrace: number;
  closeBrace: number;
  bodyLength: number;
};

function scanJavaMethodBodies(source: string): JavaMethodBody[] {
  const methods: JavaMethodBody[] = [];

  let braceDepth = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let inChar = false;
  let escape = false;

  const isIdentChar = (c: string) => /[A-Za-z0-9_$]/.test(c);

  function prevNonWsIndex(from: number): number {
    for (let i = from; i >= 0; i--) {
      const ch = source[i]!;
      if (!/\s/.test(ch)) return i;
    }
    return -1;
  }

  function findMatchingBrace(openIndex: number): number {
    let depth = 0;
    let inLC = false;
    let inBC = false;
    let inStr = false;
    let inCh = false;
    let esc = false;

    for (let i = openIndex; i < source.length; i++) {
      const ch = source[i]!;
      const next = i + 1 < source.length ? source[i + 1]! : "";

      if (inLC) {
        if (ch === "\n") inLC = false;
        continue;
      }
      if (inBC) {
        if (ch === "*" && next === "/") {
          inBC = false;
          i++;
        }
        continue;
      }
      if (inStr) {
        if (esc) {
          esc = false;
          continue;
        }
        if (ch === "\\") {
          esc = true;
          continue;
        }
        if (ch === '"') inStr = false;
        continue;
      }
      if (inCh) {
        if (esc) {
          esc = false;
          continue;
        }
        if (ch === "\\") {
          esc = true;
          continue;
        }
        if (ch === "'") inCh = false;
        continue;
      }

      if (ch === "/" && next === "/") {
        inLC = true;
        i++;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBC = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "'") {
        inCh = true;
        continue;
      }

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1;
  }

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    const next = i + 1 < source.length ? source[i + 1]! : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (inChar) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === "'") inChar = false;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "'") {
      inChar = true;
      continue;
    }

    if (ch === "{") {
      const depthBefore = braceDepth;
      braceDepth++;

      // Method bodies are typically blocks at class depth 1, preceded by ')'.
      if (depthBefore === 1) {
        const prev = prevNonWsIndex(i - 1);
        if (prev >= 0 && source[prev] === ")") {
          // Extract method name: scan back to matching '(' then identifier before it.
          let parenDepth = 0;
          let openParen = -1;
          for (let j = prev; j >= 0; j--) {
            const c = source[j]!;
            if (c === ")") parenDepth++;
            else if (c === "(") {
              parenDepth--;
              if (parenDepth === 0) {
                openParen = j;
                break;
              }
            }
          }

          if (openParen >= 0) {
            let k = prevNonWsIndex(openParen - 1);
            let end = k;
            while (k >= 0 && isIdentChar(source[k]!)) k--;
            const start = k + 1;
            const name = start <= end ? source.slice(start, end + 1) : "";
            const close = findMatchingBrace(i);
            if (name && close > i) {
              methods.push({
                name,
                openBrace: i,
                closeBrace: close,
                bodyLength: Math.max(0, close - i - 1),
              });
            }
          }
        }
      }

      continue;
    }

    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
  }

  return methods;
}

function replaceJavaMethodBodies(args: {
  source: string;
  methodsToScaffold: JavaMethodBody[];
  lineComment: string;
  scaffoldLevel: number;
  learningGoal?: string | undefined;
}): { code: string; replacedCount: number } {
  let out = args.source;
  const sorted = [...args.methodsToScaffold].sort((a, b) => b.openBrace - a.openBrace);

  for (const m of sorted) {
    const open = m.openBrace;
    const close = m.closeBrace;
    if (open < 0 || close <= open) continue;

    const lineStart = out.lastIndexOf("\n", open);
    const indentMatch = out.slice(lineStart + 1, open).match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";
    const bodyIndent = `${indent}  `;
    const todo = buildTodoLines({
      lineComment: args.lineComment,
      scaffoldLevel: args.scaffoldLevel,
      learningGoal: args.learningGoal,
    });

    const body =
      `\n` +
      todo.map((l) => `${bodyIndent}${l}`).join("\n") +
      `\n${bodyIndent}throw new UnsupportedOperationException("TODO");\n` +
      indent;

    out = out.slice(0, open + 1) + body + out.slice(close);
  }

  return { code: out, replacedCount: sorted.length };
}

function scaffoldJavaFromReference(args: {
  reference: string;
  scaffoldLevel: number;
  lineComment: string;
  learningGoal?: string | undefined;
}): { code: string; replacedCount: number } {
  const marker = `${args.lineComment} BEGIN STUDENT TODO`;
  if (args.reference.includes(marker)) {
    throw new GenerationContractError("reference artifact must not include STUDENT TODO markers.", {
      slotIndex: -1,
      llmOutputHash: undefined,
    });
  }

  const methods = scanJavaMethodBodies(args.reference).filter((m) => m.name !== "main");
  if (methods.length === 0) return { code: args.reference, replacedCount: 0 };

  const missingFraction = Math.max(0, Math.min(1, 1 - args.scaffoldLevel));
  const targetCount = Math.max(1, Math.min(methods.length, Math.ceil(methods.length * missingFraction)));
  const byComplexity = [...methods].sort((a, b) => (b.bodyLength === a.bodyLength ? a.openBrace - b.openBrace : b.bodyLength - a.bodyLength));
  const chosen = byComplexity.slice(0, targetCount);

  return replaceJavaMethodBodies({
    source: args.reference,
    methodsToScaffold: chosen,
    lineComment: args.lineComment,
    scaffoldLevel: args.scaffoldLevel,
    learningGoal: args.learningGoal,
  });
}

export function applyGuidedScaffolding(draft: GeneratedProblemDraft, slot: ProblemSlot): GeneratedProblemDraft {
  const scaffoldRaw = slot.pedagogy?.scaffold_level;
  const level = normalizeScaffoldLevel(scaffoldRaw);
  if (level == null) return draft;

  const profile = getLanguageProfile(draft.language);
  const lineComment = profile.scaffolding?.lineComment ?? (draft.language === "python" ? "#" : "//");
  const learningGoal = slot.pedagogy?.learning_goal;

  if (draft.language === "java") {
    if ("reference_solution" in draft) {
      const scaffolded = scaffoldJavaFromReference({
        reference: draft.reference_solution,
        scaffoldLevel: level,
        lineComment,
        learningGoal,
      });
      trace("generation.guided.scaffolded", {
        slotIndex: slot.index,
        language: draft.language,
        kind: "starter_code",
        scaffoldLevel: level,
        replacedCount: scaffolded.replacedCount,
      });
      return { ...draft, starter_code: scaffolded.code };
    }

    const entryPaths = new Set(
      draft.reference_workspace.files.filter((f) => f.role === "entry").map((f) => f.path)
    );

    const nextFiles = draft.reference_workspace.files.map((f) => {
      if (entryPaths.has(f.path)) return f;
      const scaffolded = scaffoldJavaFromReference({
        reference: f.content,
        scaffoldLevel: level,
        lineComment,
        learningGoal,
      });
      return { ...f, content: scaffolded.code };
    });

    trace("generation.guided.scaffolded", {
      slotIndex: slot.index,
      language: draft.language,
      kind: "workspace",
      scaffoldLevel: level,
      files: nextFiles.length,
    });

    return {
      ...draft,
      // Derive the student-facing workspace from the validated reference workspace.
      workspace: { ...draft.reference_workspace, files: nextFiles },
    };
  }

  // Phase 1: Guided scaffolding is currently implemented for Java only.
  // Other languages will still carry pedagogy metadata, but retain their existing starter code.
  return draft;
}

