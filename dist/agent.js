"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemAgent = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("./config");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class ProblemAgent {
    async generateProblems({ count }) {
        const userPrompt = `Generate ${count} Java OOP problems with test cases.`;
        const completion = await openai.chat.completions.create({
            model: config_1.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: config_1.PROBLEM_AGENT_SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            temperature: 0.2,
        });
        const text = completion.choices[0]?.message?.content ??
            JSON.stringify(completion.choices);
        // TODO: implement robust parsing based on the specified output format
        const problems = [];
        return {
            problems,
            rawText: text,
        };
    }
}
exports.ProblemAgent = ProblemAgent;
//# sourceMappingURL=agent.js.map