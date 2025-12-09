export declare const CLAUDE_MODEL: string;
export declare const PROBLEM_AGENT_SYSTEM_PROMPT = "\nYou are Codem\u2019s autonomous Java activity generator. Produce CodeChum-style Java OOP activities that can be graded automatically in Docker with JUnit 5.\n\nHard requirements for every problem:\n- Java 17, no package declarations anywhere.\n- Provide class skeleton with required method signatures and TODOs for the learner.\n- Provide a complete JUnit 5 test suite with exactly 8 @Test methods.\n- Tests must assert real behavior (no placeholders like assertTrue(true)), and must verify outputs/return values and/or stdout content (printf/userflow style). Use Assertions.assertEquals/contains, etc.\n- Tests must import org.junit.jupiter.api.Test and static org.junit.jupiter.api.Assertions.* only.\n- Test class must reference the class and methods defined in classSkeleton; names must match.\n- Include sampleInputs and sampleOutputs that align with the test expectations.\n- Do not include any prose/markdown outside the JSON payload.\n";
export interface GeneratedProblem {
    id: string;
    title: string;
    description: string;
    classSkeleton: string;
    testSuite: string;
    constraints: string;
    sampleInputs: string[];
    sampleOutputs: string[];
}
export interface JudgeResult {
    success: boolean;
    passedTests: string[];
    failedTests: string[];
    stdout: string;
    stderr: string;
    executionTimeMs: number;
}
export interface Activity {
    id: string;
    title: string;
    prompt: string;
    problems: GeneratedProblem[];
    createdAt: string;
}
export declare const STRUCTURED_JSON_INSTRUCTIONS = "\nReturn ONLY valid JSON. Do not include code fences, commentary, or markdown.\nFormat:\n{\n  \"problems\": [\n    {\n      \"id\": \"string-uuid-or-slug\",\n      \"title\": \"string\",\n      \"description\": \"string\",\n      \"classSkeleton\": \"string\",\n      \"testSuite\": \"string\",\n      \"constraints\": \"string\",\n      \"sampleInputs\": [\"string\"],\n      \"sampleOutputs\": [\"string\"]\n    }\n  ]\n}\nEnsure exactly 5 problems. Each testSuite must have exactly 8 @Test methods with real assertions (no assertTrue(true) placeholders), using JUnit 5 imports (org.junit.jupiter.api.Test and static org.junit.jupiter.api.Assertions.*).\nTests must cover stdout/printf-style outputs or return values matching the described userflow. Use assertEquals/assertTrue/assertFalse/assertThrows with meaningful expectations.\nDo not emit any package declarations. Class names in classSkeleton must match the class under test referenced in the testSuite.\nInclude method signatures students must implement in classSkeleton; do not implement the full solution.\nInclude sampleInputs and sampleOutputs that reflect the expected behavior and stdout shown in the tests.\nRespond ONLY with JSON. NO prose, NO markdown, NO extra text.\n";
//# sourceMappingURL=config.d.ts.map