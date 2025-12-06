export declare const OPENAI_MODEL = "gpt-4.1";
export declare const PROBLEM_AGENT_SYSTEM_PROMPT = "\nYou are an autonomous AI generator responsible for producing high-quality, CodeChum-style Java OOP programming activities. \n\nEach activity must be solvable using Java 17 and must run inside a Docker-based Java compiler environment with JUnit 5.\n\nYour role is to produce:\n\n1. A set of Java OOP programming problems.\n2. Each problem\u2019s full problem statement.\n3. Each problem\u2019s expected class skeleton and method signatures.\n4. A complete JUnit 5 test suite (8 test cases per problem) that will be executed inside a Java 17 Docker container.\n\n[Insert ALL the detailed GLOBAL REQUIREMENTS + RULES + OUTPUT FORMAT + VALIDATION RULES exactly as provided in the original instruction]\n";
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
//# sourceMappingURL=config.d.ts.map