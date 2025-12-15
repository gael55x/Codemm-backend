"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemAgent = void 0;
const config_1 = require("./config");
const anthropic_1 = require("./infra/llm/anthropic");
const jsonParser_1 = require("./utils/jsonParser");
const javaCodegen_1 = require("./utils/javaCodegen");
class ProblemAgent {
    async generateProblems({ count, prompt, validate = true, enforceCount = true, }) {
        const basePrompt = prompt ??
            `Generate exactly ${count} Java OOP problems with test cases following the required JSON format. Respond ONLY with JSON.`;
        const reinforcedPrompt = `${basePrompt}\nReturn exactly ${count} problems in the JSON "problems" array. Do not return fewer. Do not include any prose or markdown.`;
        const anthropic = (0, anthropic_1.getAnthropicClient)();
        const runOnce = async (overridePrompt) => {
            const completion = await anthropic.messages.create({
                model: config_1.CLAUDE_MODEL,
                max_tokens: 5000,
                temperature: 0.2,
                system: `${config_1.PROBLEM_AGENT_SYSTEM_PROMPT}\n\n${config_1.STRUCTURED_JSON_INSTRUCTIONS}`,
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
        let lastResult = null;
        let lastCount = 0;
        // Try up to 3 times; if still not 5, throw to keep behavior predictable.
        for (let i = 0; i < 3; i++) {
            const promptVariant = i === 0
                ? reinforcedPrompt
                : `${reinforcedPrompt}\nPreviously you returned ${lastCount} problems. You must return exactly ${count} problems now. No explanations.`;
            try {
                const result = await runOnce(promptVariant);
                lastResult = result;
                if (result.problems.length === count) {
                    return result;
                }
                lastCount = result.problems.length;
            }
            catch (err) {
                lastResult = null;
                if (i === 2) {
                    throw err;
                }
                // retry with the next reinforced prompt
            }
        }
        throw new Error(lastResult
            ? `Failed to generate exactly ${count} problems after retries; last had ${lastResult.problems.length}.`
            : "Failed to generate problems.");
    }
    parseAndValidate(text, expectedCount) {
        const parsed = (0, jsonParser_1.tryParseJson)(text);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.problems)) {
            throw new Error("Agent response missing problems array.");
        }
        const rawProblems = parsed.problems;
        if (!rawProblems || rawProblems.length === 0) {
            throw new Error("No problems found in agent response.");
        }
        // Normalize and repair each problem so downstream code can rely on the shape.
        let problems = rawProblems.map((pRaw, idx) => {
            const baseId = typeof pRaw.id === "string" && pRaw.id.trim()
                ? pRaw.id.trim()
                : `problem-${idx + 1}`;
            const title = typeof pRaw.title === "string" && pRaw.title.trim()
                ? pRaw.title.trim()
                : `Problem ${idx + 1}`;
            const description = typeof pRaw.description === "string" && pRaw.description.trim()
                ? pRaw.description
                : `Description for ${title}.`;
            // Determine or synthesize class name
            let classSkeleton = typeof pRaw.classSkeleton === "string" && pRaw.classSkeleton.trim()
                ? pRaw.classSkeleton
                : "";
            let clsMatch = classSkeleton.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
            let className = clsMatch && clsMatch[1] ? clsMatch[1] : `Problem${idx + 1}`;
            // If skeleton missing or has package, synthesize a clean one
            if (!classSkeleton.trim() || /^\s*package\s+/m.test(classSkeleton)) {
                classSkeleton = (0, javaCodegen_1.buildDefaultClassSkeleton)(className);
            }
            // Prepare test suite
            let testSuite = typeof pRaw.testSuite === "string" && pRaw.testSuite.trim()
                ? pRaw.testSuite
                : "";
            const hasPackage = /^\s*package\s+/m.test(testSuite);
            const testCount = (testSuite.match(/@Test/g) || []).length;
            const hasTestImport = /org\.junit\.jupiter\.api\.Test/.test(testSuite);
            const hasAssertionsImport = /org\.junit\.jupiter\.api\.Assertions/.test(testSuite) ||
                /static org\.junit\.jupiter\.api\.Assertions\.\*/.test(testSuite);
            const referencesClass = new RegExp(`\\b${className}\\b`).test(testSuite);
            const invalidStructure = !testSuite.trim() ||
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
            const constraints = typeof pRaw.constraints === "string" && pRaw.constraints.trim()
                ? pRaw.constraints
                : "Java 17, JUnit 5, no package declarations.";
            const sampleInputs = Array.isArray(pRaw.sampleInputs)
                ? pRaw.sampleInputs
                : [];
            const sampleOutputs = Array.isArray(pRaw.sampleOutputs)
                ? pRaw.sampleOutputs
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
            throw new Error(`Expected ${expectedCount} problems but received ${problems.length} from agent response.`);
        }
        return problems;
    }
}
exports.ProblemAgent = ProblemAgent;
//# sourceMappingURL=agent.js.map