"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKING_CONFIDENCE = exports.AmbiguityRisk = void 0;
exports.getConfidence = getConfidence;
exports.classifyAmbiguityRisk = classifyAmbiguityRisk;
const readiness_1 = require("./readiness");
var AmbiguityRisk;
(function (AmbiguityRisk) {
    AmbiguityRisk["SAFE"] = "SAFE";
    AmbiguityRisk["DEFERABLE"] = "DEFERABLE";
    AmbiguityRisk["BLOCKING"] = "BLOCKING";
})(AmbiguityRisk || (exports.AmbiguityRisk = AmbiguityRisk = {}));
exports.BLOCKING_CONFIDENCE = {
    language: 0.6,
    problem_count: 0.5,
    difficulty_plan: 0.5,
    topic_tags: 0.3,
    problem_style: 0.4,
};
function getConfidence(confidence, key) {
    const raw = confidence?.[String(key)];
    if (typeof raw !== "number" || !Number.isFinite(raw))
        return 0;
    return Math.max(0, Math.min(1, raw));
}
function classifyAmbiguityRisk(field, confidence) {
    const required = readiness_1.REQUIRED_CONFIDENCE[field];
    const requiredThreshold = typeof required === "number" ? required : 1;
    const blocking = exports.BLOCKING_CONFIDENCE[field];
    const blockingThreshold = typeof blocking === "number" ? blocking : Math.min(0.25, requiredThreshold);
    if (confidence >= requiredThreshold)
        return AmbiguityRisk.SAFE;
    if (confidence >= blockingThreshold)
        return AmbiguityRisk.DEFERABLE;
    return AmbiguityRisk.BLOCKING;
}
//# sourceMappingURL=ambiguity.js.map