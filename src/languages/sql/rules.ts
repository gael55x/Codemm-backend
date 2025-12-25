import { z } from "zod";

function stripSqlComments(source: string): string {
  // Remove /* */ and -- comments
  const withoutBlock = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutBlock.replace(/--.*$/gm, "");
}

function looksLikeSelectOnly(sql: string): boolean {
  const s = stripSqlComments(sql).trim().toLowerCase();
  if (!s) return false;

  // Allow common WITH ... SELECT patterns.
  const startsOk = s.startsWith("select") || s.startsWith("with");
  if (!startsOk) return false;

  // Disallow obvious mutating / dangerous statements.
  const forbidden = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "create",
    "replace",
    "pragma",
    "attach",
    "detach",
    "vacuum",
    "reindex",
  ];
  return !forbidden.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(s));
}

export const SqlQuerySchema = z
  .string()
  .min(1)
  .superRefine((sql, ctx) => {
    if (!looksLikeSelectOnly(sql)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SQL solution must be a read-only SELECT query (WITH/SELECT).",
      });
    }
  });

export type SqlTestSuite = {
  schema_sql: string;
  cases: Array<{
    name: string; // test_case_1..8
    seed_sql: string;
    expected: { columns: string[]; rows: Array<Array<string | number | null>> };
    order_matters?: boolean;
  }>;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function normalizeSqlCaseObject(input: unknown): UnknownRecord | null {
  if (!isRecord(input)) return null;
  const seed_sql = typeof input.seed_sql === "string" ? input.seed_sql : input.seed_sql != null ? String(input.seed_sql) : "";
  const expected = isRecord(input.expected) ? input.expected : null;
  const order = (input as any).order_matters ?? (input as any)["order_matters?"];

  const out: UnknownRecord = { seed_sql };
  if (expected) out.expected = expected;
  if (order != null) out.order_matters = Boolean(order);
  return out;
}

/**
 * Coerces common LLM outputs into the canonical SQL test suite JSON string shape:
 * `{ schema_sql: string, cases: [{name, seed_sql, expected, order_matters?}, ...] }`.
 *
 * This does NOT relax validation: callers should still validate the resulting string
 * with `isValidSqlTestSuite(...)`.
 */
export function coerceSqlTestSuiteToJsonString(raw: unknown, testCount: number): string {
  if (typeof raw === "string") return raw.trim();
  if (!isRecord(raw)) return "";

  const schema_sql = typeof raw.schema_sql === "string" ? raw.schema_sql : "";

  // Shape A: { schema_sql, cases: [...] }
  if (schema_sql && Array.isArray(raw.cases)) {
    const cases = raw.cases
      .map((c) => (isRecord(c) ? c : null))
      .filter(Boolean)
      .map((c) => {
        const normalized = normalizeSqlCaseObject(c);
        const name = typeof c!.name === "string" ? c!.name : "";
        return { name, ...(normalized ?? {}) };
      });
    return JSON.stringify({ schema_sql, cases });
  }

  // Shape B: { schema_sql, test_case_1: {...}, ..., test_case_8: {...} }
  if (schema_sql) {
    const cases: UnknownRecord[] = [];
    for (let i = 1; i <= testCount; i++) {
      const key = `test_case_${i}`;
      const normalized = normalizeSqlCaseObject((raw as any)[key]);
      if (!normalized) continue;
      cases.push({ name: key, ...normalized });
    }
    return JSON.stringify({ schema_sql, cases });
  }

  // Fallback: stringify as-is so schema validation can fail deterministically with a useful message.
  try {
    return JSON.stringify(raw);
  } catch {
    return "";
  }
}

export function isValidSqlTestSuite(raw: string, testCount: number): boolean {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== "object") return false;
  if (typeof parsed.schema_sql !== "string" || !parsed.schema_sql.trim()) return false;
  if (!Array.isArray(parsed.cases) || parsed.cases.length !== testCount) return false;

  const seen = new Set<string>();
  for (const c of parsed.cases) {
    if (!c || typeof c !== "object") return false;
    if (typeof c.name !== "string") return false;
    const name = c.name.trim();
    if (!/^test_case_[1-8]$/.test(name)) return false;
    if (seen.has(name)) return false;
    seen.add(name);
    if (typeof c.seed_sql !== "string") return false;
    const exp = c.expected;
    if (!exp || typeof exp !== "object") return false;
    if (!Array.isArray(exp.columns) || exp.columns.length === 0) return false;
    if (!Array.isArray(exp.rows)) return false;
  }

  for (let i = 1; i <= testCount; i++) {
    if (!seen.has(`test_case_${i}`)) return false;
  }

  return true;
}
