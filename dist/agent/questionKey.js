"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicQuestionKey = getDynamicQuestionKey;
const readiness_1 = require("./readiness");
const conversationGoals_1 = require("./conversationGoals");
/**
 * Stable identifier for "what question are we currently trying to answer?"
 * Used to decide whether to keep buffering messages or reset the buffer.
 */
function getDynamicQuestionKey(spec, confidence, commitments) {
    const readiness = (0, readiness_1.computeReadiness)(spec, confidence, commitments ?? undefined);
    if (readiness.ready)
        return "ready";
    if (readiness.gaps.complete && readiness.lowConfidenceFields.length > 0) {
        return `confirm:${readiness.lowConfidenceFields.map(String).sort().join(",")}`;
    }
    const invalidKeys = Object.keys(readiness.gaps.invalid);
    if (invalidKeys.length > 0)
        return `invalid:${invalidKeys[0]}`;
    const nextGoal = (0, conversationGoals_1.selectNextGoal)({ spec, gaps: readiness.gaps, commitments: commitments ?? null });
    if (nextGoal)
        return `goal:${nextGoal}`;
    return null;
}
//# sourceMappingURL=questionKey.js.map