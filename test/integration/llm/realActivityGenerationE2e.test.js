require("../../helpers/setupDb");

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");

const { userDb, activityDb } = require("../../../src/database");
const { createSession, processSessionMessage, generateFromSession, getSession } = require("../../../src/services/sessionService");

function parseCsvEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw || !String(raw).trim()) return fallback;
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function preflightOrThrow() {
  if (!process.env.CODEX_API_KEY) {
    throw new Error("Missing CODEX_API_KEY. Set it (and ensure network access) to run CODEMM_E2E_REAL_LLM tests.");
  }

  // These tests run the full generation pipeline, including Docker validation.
  const requiredImages = ["codem-java-judge", "codem-python-judge", "codem-cpp-judge", "codem-sql-judge"];
  for (const img of requiredImages) {
    try {
      execSync(`docker image inspect ${img}`, { stdio: "ignore" });
    } catch {
      throw new Error(
        `Missing Docker image "${img}". Build judge images first (recommended: ./run-codem-backend.sh or REBUILD_JUDGE=1 ./run-codem-backend.sh).`
      );
    }
  }
}

test(
  "e2e (real LLM): prompt → dialogue → READY → generateFromSession → activity persisted (2 × stdout/return/mixed × 4 langs)",
  // This test exercises real LLM calls + real Docker validation across a large matrix.
  // Keep a generous timeout to avoid parent cancellation cascading into many subtest failures.
  { timeout: 6 * 60 * 60 * 1000 },
  async (t) => {
    preflightOrThrow();

    // Keep behavior stable (workspace mode adds extra variability).
    const prevWorkspace = process.env.CODEMM_WORKSPACE_GEN;
    process.env.CODEMM_WORKSPACE_GEN = "0";
    t.after(() => {
      if (prevWorkspace == null) delete process.env.CODEMM_WORKSPACE_GEN;
      else process.env.CODEMM_WORKSPACE_GEN = prevWorkspace;
    });

    const languages = parseCsvEnv("CODEMM_E2E_LANGS", ["java", "python", "cpp", "sql"]);
    const styles = parseCsvEnv("CODEMM_E2E_STYLES", ["stdout", "return", "mixed"]);
    const counts = parseCsvEnv("CODEMM_E2E_COUNTS", ["2"]).map((s) => Number(s));

    const suffix = crypto.randomUUID().slice(0, 8);
    const userId = userDb.create(`e2e_real_${suffix}`, `e2e_real_${suffix}@example.com`, "hash");

    for (const language of languages) {
      for (const style of styles) {
        for (const count of counts) {
          await t.test(
            `${language} style=${style} count=${count}`,
            { timeout: 90 * 60 * 1000 },
            async () => {
              assert.ok(Number.isInteger(count) && count >= 1 && count <= 7, "Counts must be in 1..7");

              const topic =
                language === "java"
                  ? "arrays"
                  : language === "python"
                    ? "strings"
                    : language === "cpp"
                      ? "graphs"
                      : "filtering";

              // Make it 1-turn READY by providing explicit problem_count + difficulty plan.
              // difficultyPlanParser will deterministically set difficulty_plan and problem_count from "easy:N".
              const prompt = `Language: ${language}\nStyle: ${style}\nTopics: ${topic}\nDifficulty: easy:${count}`;

              const { sessionId } = createSession(userId, "practice");
              const msg = await processSessionMessage(sessionId, prompt);
              assert.equal(msg.accepted, true);
              assert.equal(msg.done, true);
              assert.equal(msg.state, "READY");
              assert.equal(msg.spec.language, language);
              assert.equal(msg.spec.problem_count, count);
              assert.equal(msg.spec.problem_style, style);

              const generated = await generateFromSession(sessionId, userId);
              assert.ok(generated.activityId);
              assert.equal(generated.problems.length, count);
              for (const p of generated.problems) {
                assert.equal(p.language, language);
                assert.equal("reference_solution" in p, false);
                assert.equal("reference_workspace" in p, false);
              }

              const stored = activityDb.findById(generated.activityId);
              assert.ok(stored);
              const storedProblems = JSON.parse(stored.problems);
              assert.equal(storedProblems.length, count);

              const s = getSession(sessionId);
              assert.equal(s.state, "SAVED");
            }
          );
        }
      }
    }
  }
);
