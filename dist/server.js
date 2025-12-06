"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const agent_1 = require("./agent");
const judge_1 = require("./judge");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
const agent = new agent_1.ProblemAgent();
app.post("/generate", async (req, res) => {
    try {
        const count = typeof req.body?.count === "number" ? req.body.count : 5;
        const { problems, rawText } = await agent.generateProblems({ count });
        // TODO: Implement real validation of the agent output
        const responseProblems = problems.length === count
            ? problems
            : [
                {
                    id: "placeholder-1",
                    title: "Placeholder Problem",
                    description: "ProblemAgent parsing not yet implemented.",
                    classSkeleton: "public class Solution {\n}\n",
                    testSuite: "import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolutionTest {\n    @Test\n    void placeholder() {\n        assertTrue(true);\n    }\n}\n",
                    constraints: "Java 17, JUnit 5",
                    sampleInputs: [],
                    sampleOutputs: [],
                },
            ];
        res.json({
            problems: responseProblems,
            raw: rawText,
        });
    }
    catch (err) {
        console.error("Error in /generate:", err);
        res.status(500).json({ error: "Failed to generate problems." });
    }
});
app.post("/submit", async (req, res) => {
    try {
        const { code, testSuite } = req.body ?? {};
        if (typeof code !== "string" || typeof testSuite !== "string") {
            return res.status(400).json({ error: "code and testSuite are required strings." });
        }
        const result = await (0, judge_1.runJudge)(code, testSuite);
        res.json(result);
    }
    catch (err) {
        console.error("Error in /submit:", err);
        res.status(500).json({ error: "Failed to judge submission." });
    }
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(port, () => {
    console.log(`Codem backend listening on port ${port}`);
});
//# sourceMappingURL=server.js.map