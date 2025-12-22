"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommitmentsJson = parseCommitmentsJson;
exports.serializeCommitments = serializeCommitments;
exports.listCommitments = listCommitments;
exports.isFieldLocked = isFieldLocked;
exports.shouldLockCommitment = shouldLockCommitment;
exports.upsertCommitment = upsertCommitment;
exports.removeCommitment = removeCommitment;
const readiness_1 = require("./readiness");
function parseCommitmentsJson(json) {
    if (!json)
        return {};
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed))
            return {};
        const store = {};
        for (const item of parsed) {
            if (!item || typeof item !== "object")
                continue;
            const field = item.field;
            if (typeof field !== "string" || !field)
                continue;
            const confidence = item.confidence;
            const source = item.source;
            const locked = item.locked;
            store[field] = {
                field,
                value: item.value,
                confidence: typeof confidence === "number" && Number.isFinite(confidence) ? confidence : 0,
                source: source === "explicit" ? "explicit" : "implicit",
                locked: locked === true,
            };
        }
        return store;
    }
    catch {
        return {};
    }
}
function serializeCommitments(store) {
    const items = Object.values(store)
        .filter(Boolean)
        .sort((a, b) => String(a.field).localeCompare(String(b.field)));
    return JSON.stringify(items);
}
function listCommitments(store) {
    return Object.values(store)
        .filter((c) => Boolean(c))
        .sort((a, b) => String(a.field).localeCompare(String(b.field)));
}
function isFieldLocked(store, field) {
    return store[field]?.locked === true;
}
function shouldLockCommitment(field, confidence, source) {
    if (source !== "explicit")
        return false;
    const threshold = readiness_1.REQUIRED_CONFIDENCE[field];
    const required = typeof threshold === "number" ? threshold : 1;
    return confidence >= required;
}
function upsertCommitment(store, next) {
    const normalizedConfidence = Number.isFinite(next.confidence) ? Math.max(0, Math.min(1, next.confidence)) : 0;
    const locked = shouldLockCommitment(next.field, normalizedConfidence, next.source);
    return {
        ...store,
        [next.field]: {
            field: next.field,
            value: next.value,
            confidence: normalizedConfidence,
            source: next.source,
            locked,
        },
    };
}
function removeCommitment(store, field) {
    if (!store[field])
        return store;
    const next = { ...store };
    delete next[field];
    return next;
}
//# sourceMappingURL=commitments.js.map