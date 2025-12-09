import Anthropic from "@anthropic-ai/sdk";
import JSON5 from "json5";
import { jsonrepair } from "jsonrepair";
import {
  GeneratedProblem,
  CLAUDE_MODEL,
  PROBLEM_AGENT_SYSTEM_PROMPT,
  STRUCTURED_JSON_INSTRUCTIONS,
} from "./config";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in the environment.");
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export interface GenerateProblemsRequest {
  count: number;
  prompt?: string;
  validate?: boolean;
  enforceCount?: boolean;
}

export interface GenerateProblemsResponse {
  problems: GeneratedProblem[];
  rawText: string;
}

export class ProblemAgent {
  async generateProblems({
    count,
    prompt,
    validate = true,
    enforceCount = true,
  }: GenerateProblemsRequest): Promise<GenerateProblemsResponse> {
    const basePrompt =
      prompt ??
      `Generate exactly ${count} Java OOP problems with test cases following the required JSON format. Respond ONLY with JSON.`;
    const reinforcedPrompt = `${basePrompt}\nReturn exactly ${count} problems in the JSON "problems" array. Do not return fewer. Do not include any prose or markdown.`;

    const anthropic = getAnthropicClient();

    const runOnce = async (overridePrompt?: string) => {
      const completion = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 5000,
        temperature: 0.2,
        system: `${PROBLEM_AGENT_SYSTEM_PROMPT}\n\n${STRUCTURED_JSON_INSTRUCTIONS}`,
        messages: [
          {
            role: "user",
            content: overridePrompt ?? reinforcedPrompt,
          },
        ],
      });

      const text = completion.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n");

      const problems = validate ? this.parseAndValidate(text, count) : [];
      return { problems, rawText: text };
    };

    // For chat-style usage we skip count enforcement and validation/retries.
    if (!enforceCount) {
      const { rawText } = await runOnce(reinforcedPrompt);
      return { problems: [], rawText };
    }

    let lastResult: GenerateProblemsResponse | null = null;
    let lastCount = 0;
    // Try up to 3 times; if still not 5, throw to keep behavior predictable.
    for (let i = 0; i < 3; i++) {
      const promptVariant =
        i === 0
          ? reinforcedPrompt
          : `${reinforcedPrompt}\nPreviously you returned ${lastCount} problems. You must return exactly ${count} problems now. No explanations.`;

      try {
        const result = await runOnce(promptVariant);
        lastResult = result;
        if (result.problems.length === count) {
          return result;
        }
        lastCount = result.problems.length;
      } catch (err) {
        lastResult = null;
        if (i === 2) {
          throw err;
        }
        // retry with the next reinforced prompt
      }
    }

    throw new Error(
      lastResult
        ? `Failed to generate exactly ${count} problems after retries; last had ${lastResult.problems.length}.`
        : "Failed to generate problems."
    );
  }

  private parseAndValidate(text: string, expectedCount: number): GeneratedProblem[] {
    const parsed = this.tryParseJson(text);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as any).problems)) {
      throw new Error("Agent response missing problems array.");
    }

    const rawProblems = (parsed as any).problems as any[];
    if (!rawProblems || rawProblems.length === 0) {
      throw new Error("No problems found in agent response.");
    }

    // Normalize and repair each problem so downstream code can rely on the shape.
    let problems: GeneratedProblem[] = rawProblems.map((pRaw, idx) => {
      const baseId =
        typeof pRaw.id === "string" && pRaw.id.trim()
          ? pRaw.id.trim()
          : `problem-${idx + 1}`;
      const title =
        typeof pRaw.title === "string" && pRaw.title.trim()
          ? pRaw.title.trim()
          : `Problem ${idx + 1}`;
      const description =
        typeof pRaw.description === "string" && pRaw.description.trim()
          ? pRaw.description
          : `Description for ${title}.`;

      // Determine or synthesize class name
      let classSkeleton =
        typeof pRaw.classSkeleton === "string" && pRaw.classSkeleton.trim()
          ? pRaw.classSkeleton
          : "";
      let clsMatch = classSkeleton.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      let className =
        clsMatch && clsMatch[1] ? clsMatch[1] : `Problem${idx + 1}`;

      // If skeleton missing or has package, synthesize a clean one
      if (!classSkeleton.trim() || /^\s*package\s+/m.test(classSkeleton)) {
        classSkeleton = this.buildDefaultClassSkeleton(className);
      }

      // Prepare test suite
      let testSuite =
        typeof pRaw.testSuite === "string" && pRaw.testSuite.trim()
          ? pRaw.testSuite
          : "";

      const hasPackage = /^\s*package\s+/m.test(testSuite);
      const testCount = (testSuite.match(/@Test/g) || []).length;
      const hasTestImport = /org\.junit\.jupiter\.api\.Test/.test(testSuite);
      const hasAssertionsImport =
        /org\.junit\.jupiter\.api\.Assertions/.test(testSuite) ||
        /static org\.junit\.jupiter\.api\.Assertions\.\*/.test(testSuite);
      const referencesClass = new RegExp(`\\b${className}\\b`).test(testSuite);

      const invalidStructure =
        !testSuite.trim() ||
        hasPackage ||
        testCount !== 8 ||
        !hasTestImport ||
        !hasAssertionsImport ||
        !referencesClass;

      // If the model gave us something structurally broken, fail validation so the
      // caller can retry generation instead of silently downgrading to no-op tests.
      if (invalidStructure) {
        throw new Error(`Invalid or incomplete test suite structure for problem "${title}".`);
      }

      const constraints =
        typeof pRaw.constraints === "string" && pRaw.constraints.trim()
          ? pRaw.constraints
          : "Java 17, JUnit 5, no package declarations.";

      const sampleInputs = Array.isArray(pRaw.sampleInputs)
        ? (pRaw.sampleInputs as string[])
        : [];
      const sampleOutputs = Array.isArray(pRaw.sampleOutputs)
        ? (pRaw.sampleOutputs as string[])
        : [];

      return {
        id: baseId,
        title,
        description,
        classSkeleton,
        testSuite,
        constraints,
        sampleInputs,
        sampleOutputs,
      };
    });

    // Require that the model returns exactly the requested number of problems so
    // the caller can decide whether to retry generation instead of padding with
    // cloned problems.
    if (problems.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} problems but received ${problems.length} from agent response.`
      );
    }

    return problems;
  }

  private tryParseJson(text: string): any {
    let cleaned = text.trim();
    // Strip common markdown fences
    cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();

    const tryParseCandidate = (candidate: string) => {
      // strict
      try {
        return JSON.parse(candidate);
      } catch (_) {
        /* ignore */
      }
      // lenient
      try {
        return JSON5.parse(candidate);
      } catch (_) {
        /* ignore */
      }
      // repair then parse
      try {
        const repaired = jsonrepair(candidate);
        return JSON.parse(repaired);
      } catch (_) {
        // last resort: JSON5 after repair
        const repaired = jsonrepair(candidate);
        return JSON5.parse(repaired);
      }
    };

    // 1) direct parse
    try {
      return tryParseCandidate(cleaned);
    } catch (_) {
      // 2) try to extract the first { ... } block (greedy to last })
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const slice = cleaned.slice(start, end + 1);
        return tryParseCandidate(slice);
      }
      // 3) try array block
      const sArr = cleaned.indexOf("[");
      const eArr = cleaned.lastIndexOf("]");
      if (sArr !== -1 && eArr !== -1 && eArr > sArr) {
        const slice = cleaned.slice(sArr, eArr + 1);
        return tryParseCandidate(slice);
      }
      throw _;
    }
  }

  private buildDefaultClassSkeleton(className: string): string {
    return `public class ${className} {\n\n    // TODO: implement solution\n\n}\n`;
  }
}


