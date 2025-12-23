"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPP_LANGUAGE_PROFILE = void 0;
const activitySpec_1 = require("../../contracts/activitySpec");
const adapters_1 = require("./adapters");
const prompts_1 = require("./prompts");
exports.CPP_LANGUAGE_PROFILE = {
    language: "cpp",
    displayName: "C++",
    runtime: "C++20 (g++)",
    testFramework: "custom",
    defaultConstraints: activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE.cpp,
    defaultTestCaseCount: activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT,
    support: { execution: true, judge: true, generation: true },
    promptHints: ["C++20", "exactly 8 tests named test_case_1..test_case_8", "no filesystem/networking"],
    executionAdapter: adapters_1.cppExecutionAdapter,
    judgeAdapter: adapters_1.cppJudgeAdapter,
    generator: {
        systemPrompt: prompts_1.CPP_V1_GENERATOR_SYSTEM_PROMPT,
        buildSlotPrompt: prompts_1.buildCppSlotPrompt,
    },
};
//# sourceMappingURL=profile.js.map