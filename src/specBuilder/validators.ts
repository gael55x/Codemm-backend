import { z } from "zod";
import type { ActivitySpec } from "../contracts/activitySpec";
import {
  ActivityLanguageSchema,
  ActivitySpecSchema,
  DifficultyPlanSchema,
  DifficultySchema,
  CODEMM_DEFAULT_CONSTRAINTS,
  CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE,
  CODEMM_DEFAULT_TEST_CASE_COUNT,
} from "../contracts/activitySpec";
import { isLanguageSupportedForGeneration } from "../languages/profiles";
import type { JsonPatchOp } from "./patch";

export type SpecDraft = Partial<ActivitySpec> & { version?: "1.0" };

/**
 * Draft validator: allows partial specs during DRAFT/CLARIFYING,
 * but enforces immediate local correctness for any fields that are present.
 */
export const ActivitySpecDraftSchema = z
  .object({
    version: z.literal("1.0").optional(),
    language: ActivityLanguageSchema.optional(),
    problem_count: z.number().int().min(1).max(7).optional(),
    difficulty_plan: DifficultyPlanSchema.optional(),
    topic_tags: z.array(z.string().trim().min(1).max(40)).min(1).max(12).optional(),
    problem_style: z.string().trim().min(1).max(64).optional(),
    constraints: z.string().trim().min(1).max(2000).optional(),
    test_case_count: z.literal(CODEMM_DEFAULT_TEST_CASE_COUNT).optional(),
  })
  .strict()
  .superRefine((spec, ctx) => {
    if (spec.problem_count != null && spec.difficulty_plan != null) {
      const planSum = spec.difficulty_plan.reduce((sum, p) => sum + p.count, 0);
      if (planSum !== spec.problem_count) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["difficulty_plan"],
          message: `difficulty_plan counts must sum to problem_count (${spec.problem_count}). Got ${planSum}.`,
        });
      }
    }

    if (spec.constraints != null && spec.language != null) {
      const expected = CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[spec.language];
      if (spec.constraints !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["constraints"],
          message: `constraints must be exactly "${expected}" for language "${spec.language}".`,
        });
      }
    }
  });

function normalizeList(input: string): string[] {
  const raw = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const unique: string[] = [];
  for (const tag of raw) {
    if (!unique.includes(tag)) unique.push(tag);
  }
  return unique;
}

function parseIntStrict(s: string): number | null {
  const trimmed = s.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function ensureFixedFields(spec: SpecDraft): JsonPatchOp[] {
  // Hard rule: test_case_count must be exactly 8 (v1).
  const patch: JsonPatchOp[] = [];
  if (spec.test_case_count !== CODEMM_DEFAULT_TEST_CASE_COUNT) {
    patch.push({
      op: spec.test_case_count == null ? "add" : "replace",
      path: "/test_case_count",
      value: CODEMM_DEFAULT_TEST_CASE_COUNT,
    });
  }
  if (spec.version !== "1.0") {
    patch.push({ op: spec.version == null ? "add" : "replace", path: "/version", value: "1.0" });
  }

  const language = spec.language ?? "java";
  const expectedConstraints = CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[language];

  // Hard rule: constraints are invariant for Codemm v1.0 (per language).
  if (spec.constraints !== expectedConstraints) {
    patch.push({
      op: spec.constraints == null ? "add" : "replace",
      path: "/constraints",
      value: expectedConstraints,
    });
  }
  return patch;
}

export function isSpecComplete(spec: SpecDraft): spec is ActivitySpec {
  const res = ActivitySpecSchema.safeParse(spec);
  if (!res.success) return false;
  return isLanguageSupportedForGeneration(res.data.language);
}

export function validatePatchedSpecOrError(patched: SpecDraft): string | null {
  const res = ActivitySpecDraftSchema.safeParse(patched);
  if (res.success) return null;

  // Return first error message (kept short for chat UX).
  const first = res.error.issues[0];
  return first ? first.message : "Invalid ActivitySpec.";
}

export function buildPatchForLanguage(answer: string): { patch?: JsonPatchOp[]; error?: string } {
  const a = answer.trim().toLowerCase();
  if (a === "java") {
    return { patch: [{ op: "replace", path: "/language", value: "java" }] };
  }
  if (a === "python" || a === "py") {
    return { patch: [{ op: "replace", path: "/language", value: "python" }] };
  }
  return { error: "Supported languages: java, python." };
}

export function buildPatchForProblemCount(answer: string): { patch?: JsonPatchOp[]; error?: string } {
  const n = parseIntStrict(answer);
  if (n == null) return { error: "Please enter a number from 1 to 7." };
  if (n < 1 || n > 7) return { error: "problem_count must be between 1 and 7." };
  return { patch: [{ op: "replace", path: "/problem_count", value: n }] };
}

export function parseDifficultyCounts(
  answer: string
): { easy?: number; medium?: number; hard?: number } | null {
  const a = answer.toLowerCase();

  const pick = (key: "easy" | "medium" | "hard") => {
    const m = a.match(new RegExp(`${key}\\s*[:=]?\\s*(\\d+)`));
    return m && m[1] ? Number(m[1]) : undefined;
  };

  const byKey: { easy?: number; medium?: number; hard?: number } = {};
  const e = pick("easy");
  const m = pick("medium");
  const h = pick("hard");
  if (typeof e === "number") byKey.easy = e;
  if (typeof m === "number") byKey.medium = m;
  if (typeof h === "number") byKey.hard = h;

  const hasAnyKey =
    byKey.easy != null || byKey.medium != null || byKey.hard != null;

  if (hasAnyKey) {
    return byKey;
  }

  // Fallback: accept 3 integers like "2 3 1" or "2/3/1" as easy/medium/hard.
  const nums = a.match(/\d+/g)?.map((x) => Number(x)) ?? [];
  if (nums.length === 3) {
    const easy = nums[0];
    const medium = nums[1];
    const hard = nums[2];
    if (easy == null || medium == null || hard == null) return null;
    return { easy: easy, medium: medium, hard: hard };
  }

  return null;
}

export function buildPatchForDifficultyPlan(
  spec: SpecDraft,
  answer: string
): { patch?: JsonPatchOp[]; error?: string } {
  const problemCount = spec.problem_count;
  if (typeof problemCount !== "number") {
    return { error: "problem_count must be set before difficulty_plan." };
  }

  const counts = parseDifficultyCounts(answer);
  if (!counts) {
    return {
      error:
        "Provide counts for easy/medium/hard that sum to problem_count (e.g. 'easy:2, medium:2, hard:1').",
    };
  }

  const easy = Number.isFinite(counts.easy as any) ? (counts.easy ?? 0) : 0;
  const medium = Number.isFinite(counts.medium as any) ? (counts.medium ?? 0) : 0;
  const hard = Number.isFinite(counts.hard as any) ? (counts.hard ?? 0) : 0;

  if (![easy, medium, hard].every((n) => Number.isInteger(n) && n >= 0)) {
    return { error: "Difficulty counts must be non-negative integers." };
  }

  const sum = easy + medium + hard;
  if (sum !== problemCount) {
    return { error: `Counts must sum to ${problemCount}. Got ${sum}.` };
  }

  const nonZero = [easy, medium, hard].filter((n) => n > 0).length;
  if (nonZero < 2) {
    return { error: "difficulty_plan must be mixed (at least 2 non-zero difficulties)." };
  }

  // Build normalized array, omitting 0-count difficulties is allowed by schema.
  const plan = [
    { difficulty: "easy", count: easy },
    { difficulty: "medium", count: medium },
    { difficulty: "hard", count: hard },
  ]
    .filter((p) => p.count > 0)
    .map((p) => ({
      difficulty: DifficultySchema.parse(p.difficulty),
      count: p.count,
    }));

  return { patch: [{ op: "replace", path: "/difficulty_plan", value: plan }] };
}

export function buildPatchForTopicTags(answer: string): { patch?: JsonPatchOp[]; error?: string } {
  const tags = normalizeList(answer);
  if (tags.length < 1) {
    return { error: "Please provide at least 1 topic tag." };
  }
  if (tags.length > 12) {
    return { error: "Please provide at most 12 topic tags." };
  }
  return { patch: [{ op: "replace", path: "/topic_tags", value: tags }] };
}

export function buildPatchForProblemStyle(answer: string): { patch?: JsonPatchOp[]; error?: string } {
  const a = answer.trim().toLowerCase();
  const allowed = new Set(["stdout", "return", "mixed"]);
  if (!allowed.has(a)) {
    return { error: "problem_style must be one of: stdout, return, mixed." };
  }
  return { patch: [{ op: "replace", path: "/problem_style", value: a }] };
}

export function buildPatchForConstraints(answer: string): { patch?: JsonPatchOp[]; error?: string } {
  const text = answer.trim();
  if (!text) return { error: "constraints cannot be empty." };

  // Align with ActivitySpecSchema superRefine.
  const c = text.toLowerCase();
  const mentionsNoPackage = c.includes("no package");
  const mentionsJunit = c.includes("junit") || c.includes("junit 5");
  if (!mentionsNoPackage || !mentionsJunit) {
    return {
      error:
        "constraints must mention 'no package' and JUnit requirements (e.g. 'JUnit 5').",
    };
  }

  return { patch: [{ op: "replace", path: "/constraints", value: text }] };
}
