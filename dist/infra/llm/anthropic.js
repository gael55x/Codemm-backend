"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnthropicClient = getAnthropicClient;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let anthropicClient = null;
/**
 * Singleton Anthropic client.
 * Extracted from legacy ProblemAgent for reuse in v1.0 generation.
 */
function getAnthropicClient() {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set in the environment.");
    }
    if (!anthropicClient) {
        anthropicClient = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    return anthropicClient;
}
//# sourceMappingURL=anthropic.js.map