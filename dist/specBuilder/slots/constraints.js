"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constraintsSlot = void 0;
const activitySpec_1 = require("../../contracts/activitySpec");
exports.constraintsSlot = {
    key: "constraints",
    prompt: "I'll handle the runtime/test setup automatically. Anything else you want noted?",
    normalize: (_input, ctx) => activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[ctx.spec.language ?? "java"],
    validate: (_value) => null,
    autoFill: (ctx) => activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE[ctx.spec.language ?? "java"],
    hint: () => "You can just say 'ok' — the defaults are applied automatically.",
};
//# sourceMappingURL=constraints.js.map