"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GOALS = void 0;
exports.selectNextGoal = selectNextGoal;
exports.DEFAULT_GOALS = [
    { id: "content", fields: ["topic_tags"] },
    { id: "scope", fields: ["problem_count"] },
    { id: "difficulty", fields: ["difficulty_plan"] },
    { id: "checking", fields: ["problem_style"] },
    { id: "language", fields: ["language"] },
];
function fieldPresent(spec, field) {
    return spec[field] !== undefined;
}
function fieldLocked(commitments, field) {
    return commitments?.[field]?.locked === true;
}
function selectNextGoal(args) {
    if (args.gaps.complete)
        return null;
    for (const goal of exports.DEFAULT_GOALS) {
        const needsAny = goal.fields.some((f) => {
            if (fieldLocked(args.commitments, f) && fieldPresent(args.spec, f))
                return false;
            const key = f;
            return args.gaps.missing.includes(key) || args.gaps.invalid[key] != null || !fieldPresent(args.spec, f);
        });
        if (needsAny)
            return goal.id;
    }
    return null;
}
//# sourceMappingURL=conversationGoals.js.map