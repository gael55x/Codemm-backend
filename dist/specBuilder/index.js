"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextQuestionKey = getNextQuestionKey;
exports.getNextQuestion = getNextQuestion;
exports.specBuilderStep = specBuilderStep;
exports.assertReadySpec = assertReadySpec;
const patch_1 = require("./patch");
const questions_1 = require("./questions");
const validators_1 = require("./validators");
function getNextQuestionKey(spec) {
    for (const key of questions_1.QUESTION_ORDER) {
        switch (key) {
            case "language":
                if (spec.language == null)
                    return "language";
                if (spec.language !== "java")
                    return "language";
                break;
            case "problem_count":
                if (typeof spec.problem_count !== "number")
                    return "problem_count";
                if (!Number.isInteger(spec.problem_count) || spec.problem_count < 1 || spec.problem_count > 7) {
                    return "problem_count";
                }
                break;
            case "difficulty_plan":
                if (!Array.isArray(spec.difficulty_plan) || spec.difficulty_plan.length === 0) {
                    return "difficulty_plan";
                }
                break;
            case "topic_tags":
                if (!Array.isArray(spec.topic_tags) || spec.topic_tags.length === 0)
                    return "topic_tags";
                break;
            case "problem_style":
                if (typeof spec.problem_style !== "string" || !spec.problem_style.trim())
                    return "problem_style";
                break;
            case "constraints":
                if (typeof spec.constraints !== "string" || !spec.constraints.trim())
                    return "constraints";
                // Must pass the contract's refine (no package + junit)
                {
                    const c = spec.constraints.toLowerCase();
                    const ok = c.includes("no package") && (c.includes("junit") || c.includes("junit 5"));
                    if (!ok)
                        return "constraints";
                }
                break;
            default:
                return key;
        }
    }
    return null;
}
function getNextQuestion(spec) {
    const key = getNextQuestionKey(spec);
    if (!key) {
        return "Spec looks complete. You can generate the activity.";
    }
    return questions_1.QUESTIONS[key];
}
/**
 * PURE SpecBuilder step.
 *
 * Deterministic transformation:
 * (currentSpec, userMessage) -> { accepted, patch?, nextQuestion, done, error? }
 */
function specBuilderStep(currentSpec, userMessage) {
    const base = currentSpec ? { ...currentSpec } : {};
    // Enforce fixed fields (version + test_case_count) without user interaction.
    const fixed = (0, validators_1.ensureFixedFields)(base);
    const specWithFixed = fixed.length > 0 ? (0, patch_1.applyJsonPatch)(base, fixed) : base;
    const key = getNextQuestionKey(specWithFixed);
    if (!key) {
        return {
            accepted: false,
            nextQuestion: "Spec looks complete. You can generate the activity.",
            done: true,
            spec: specWithFixed,
        };
    }
    const answer = userMessage.trim();
    if (!answer) {
        return {
            accepted: false,
            nextQuestion: questions_1.QUESTIONS[key],
            done: false,
            error: "Please provide an answer.",
            spec: specWithFixed,
        };
    }
    let patch;
    let error;
    switch (key) {
        case "language": {
            const r = (0, validators_1.buildPatchForLanguage)(answer);
            patch = r.patch;
            error = r.error;
            break;
        }
        case "problem_count": {
            const r = (0, validators_1.buildPatchForProblemCount)(answer);
            patch = r.patch;
            error = r.error;
            break;
        }
        case "difficulty_plan": {
            const r = (0, validators_1.buildPatchForDifficultyPlan)(specWithFixed, answer);
            patch = r.patch;
            error = r.error;
            break;
        }
        case "topic_tags": {
            const r = (0, validators_1.buildPatchForTopicTags)(answer);
            patch = r.patch;
            error = r.error;
            break;
        }
        case "problem_style": {
            const r = (0, validators_1.buildPatchForProblemStyle)(answer);
            patch = r.patch;
            error = r.error;
            break;
        }
        case "constraints": {
            const r = (0, validators_1.buildPatchForConstraints)(answer);
            patch = r.patch;
            error = r.error;
            break;
        }
    }
    if (!patch || error) {
        return {
            accepted: false,
            nextQuestion: questions_1.QUESTIONS[key],
            done: false,
            error: error ?? "Invalid answer.",
            spec: specWithFixed,
        };
    }
    // Prepend fixed patches if we actually had to set them.
    const fullPatch = [...fixed, ...patch];
    const patched = (0, patch_1.applyJsonPatch)(specWithFixed, patch);
    // Validate immediately (strict contract). Reject if invalid.
    const contractError = (0, validators_1.validatePatchedSpecOrError)(patched);
    if (contractError) {
        return {
            accepted: false,
            nextQuestion: questions_1.QUESTIONS[key],
            done: false,
            error: contractError,
            spec: specWithFixed,
        };
    }
    const done = (0, validators_1.isSpecComplete)(patched);
    return {
        accepted: true,
        patch: fullPatch,
        nextQuestion: done ? "Spec looks complete. You can generate the activity." : getNextQuestion(patched),
        done,
        spec: patched,
    };
}
// Convenience guard for callers that want a fully-validated ActivitySpec.
function assertReadySpec(spec) {
    // If it's complete, ActivitySpecSchema will have accepted it.
    if (!(0, validators_1.isSpecComplete)(spec)) {
        throw new Error("ActivitySpec is not complete/valid yet.");
    }
    return spec;
}
//# sourceMappingURL=index.js.map