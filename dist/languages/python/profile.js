"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYTHON_LANGUAGE_PROFILE = void 0;
const activitySpec_1 = require("../../contracts/activitySpec");
const adapters_1 = require("./adapters");
const prompts_1 = require("./prompts");
exports.PYTHON_LANGUAGE_PROFILE = {
    language: "python",
    displayName: "Python",
    runtime: "Python 3.11",
    testFramework: "pytest",
    defaultConstraints: activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE.python,
    defaultTestCaseCount: activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT,
    support: { execution: true, judge: true, generation: true },
    promptHints: ["Python 3.11", "pytest (exactly 8 tests)", "stdlib only", "no I/O unless specified"],
    executionAdapter: adapters_1.pythonExecutionAdapter,
    judgeAdapter: adapters_1.pythonJudgeAdapter,
    generator: {
        systemPrompt: prompts_1.PYTHON_V1_GENERATOR_SYSTEM_PROMPT,
        buildSlotPrompt: prompts_1.buildPythonSlotPrompt,
    },
};
//# sourceMappingURL=profile.js.map