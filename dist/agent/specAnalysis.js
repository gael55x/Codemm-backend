"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSpecGaps = analyzeSpecGaps;
exports.defaultNextQuestionFromGaps = defaultNextQuestionFromGaps;
const activitySpec_1 = require("../contracts/activitySpec");
const profiles_1 = require("../languages/profiles");
/**
 * Computes "what's missing/invalid" from the strict ActivitySpecSchema, without relying on slot order.
 * This is the first building block for a goal-driven prompt generator.
 */
function analyzeSpecGaps(spec) {
    const res = activitySpec_1.ActivitySpecSchema.safeParse(spec);
    if (res.success) {
        if (!(0, profiles_1.isLanguageSupportedForGeneration)(res.data.language)) {
            return {
                complete: false,
                missing: [],
                invalid: {
                    language: `Language "${res.data.language}" is not supported for generation yet.`,
                },
            };
        }
        return { complete: true, missing: [], invalid: {} };
    }
    const missing = new Set();
    const invalid = {};
    for (const issue of res.error.issues) {
        const key = issue.path[0];
        if (!key)
            continue;
        // Missing required fields: Zod reports invalid_type with received=undefined.
        // Treat these as "missing" only (not invalid), so prompts are phrased naturally.
        if (issue.code === "invalid_type" && issue.received === "undefined") {
            missing.add(key);
            continue;
        }
        // Other issues: the field is present but violates the strict contract.
        missing.add(key);
        if (invalid[key] == null) {
            invalid[key] = issue.message;
        }
    }
    return { complete: false, missing: Array.from(missing), invalid };
}
function defaultNextQuestionFromGaps(gaps) {
    if (gaps.complete)
        return "Spec looks complete. You can generate the activity.";
    const priority = [
        "language",
        "problem_count",
        "difficulty_plan",
        "topic_tags",
        "problem_style",
    ];
    const next = priority.find((k) => gaps.missing.includes(k)) ?? gaps.missing[0];
    switch (next) {
        case "language":
            return `Which language should we use? (${(0, profiles_1.listAgentSelectableLanguages)().join(", ") || "java"} is available today.)`;
        case "problem_count":
            return "How many problems should we build? (1-7 works well.)";
        case "difficulty_plan":
            return "How hard should the problems be overall? (easy / medium / hard counts)";
        case "topic_tags":
            return "What topics should we cover? Share a few tags.";
        case "problem_style":
            return "How should solutions be checked? (stdout, return, or mixed)";
        default:
            return "What would you like this activity to focus on?";
    }
}
//# sourceMappingURL=specAnalysis.js.map