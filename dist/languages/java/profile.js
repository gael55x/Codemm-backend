"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JAVA_LANGUAGE_PROFILE = void 0;
const activitySpec_1 = require("../../contracts/activitySpec");
const adapters_1 = require("./adapters");
const prompts_1 = require("./prompts");
exports.JAVA_LANGUAGE_PROFILE = {
    language: "java",
    displayName: "Java",
    runtime: "Java 17",
    testFramework: "JUnit 5",
    defaultConstraints: activitySpec_1.CODEMM_DEFAULT_CONSTRAINTS_BY_LANGUAGE.java,
    defaultTestCaseCount: activitySpec_1.CODEMM_DEFAULT_TEST_CASE_COUNT,
    support: { execution: true, judge: true, generation: true },
    promptHints: ["No package declarations.", "JUnit 5 (exactly 8 @Test methods)."],
    executionAdapter: adapters_1.javaExecutionAdapter,
    judgeAdapter: adapters_1.javaJudgeAdapter,
    generator: {
        systemPrompt: prompts_1.JAVA_V1_GENERATOR_SYSTEM_PROMPT,
        buildSlotPrompt: prompts_1.buildJavaSlotPrompt,
    },
};
//# sourceMappingURL=profile.js.map