"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROBLEM_AGENT_SYSTEM_PROMPT = exports.OPENAI_MODEL = void 0;
exports.OPENAI_MODEL = "gpt-4.1";
exports.PROBLEM_AGENT_SYSTEM_PROMPT = `
You are an autonomous AI generator responsible for producing high-quality, CodeChum-style Java OOP programming activities. 

Each activity must be solvable using Java 17 and must run inside a Docker-based Java compiler environment with JUnit 5.

Your role is to produce:

1. A set of Java OOP programming problems.
2. Each problem’s full problem statement.
3. Each problem’s expected class skeleton and method signatures.
4. A complete JUnit 5 test suite (8 test cases per problem) that will be executed inside a Java 17 Docker container.

[Insert ALL the detailed GLOBAL REQUIREMENTS + RULES + OUTPUT FORMAT + VALIDATION RULES exactly as provided in the original instruction]
`;
//# sourceMappingURL=config.js.map