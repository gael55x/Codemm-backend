"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicQuestionKey = getDynamicQuestionKey;
const readiness_1 = require("./readiness");
const MISSING_PRIORITY = [
    "language",
    "problem_count",
    "difficulty_plan",
    "topic_tags",
    "problem_style",
];
/**
 * Stable identifier for "what question are we currently trying to answer?"
 * Used to decide whether to keep buffering messages or reset the buffer.
 */
function getDynamicQuestionKey(spec, confidence) {
    const readiness = (0, readiness_1.computeReadiness)(spec, confidence);
    if (readiness.ready)
        return "ready";
    if (readiness.gaps.complete && readiness.lowConfidenceFields.length > 0) {
        return `confirm:${readiness.lowConfidenceFields.map(String).sort().join(",")}`;
    }
    const nextMissing = MISSING_PRIORITY.find((k) => readiness.gaps.missing.includes(k)) ??
        readiness.gaps.missing[0];
    if (nextMissing)
        return String(nextMissing);
    const invalidKeys = Object.keys(readiness.gaps.invalid);
    if (invalidKeys.length > 0)
        return `invalid:${invalidKeys[0]}`;
    return null;
}
//# sourceMappingURL=questionKey.js.map