import { GeneratedProblem } from "./config";
export interface GenerateProblemsRequest {
    count: number;
}
export interface GenerateProblemsResponse {
    problems: GeneratedProblem[];
    rawText: string;
}
export declare class ProblemAgent {
    generateProblems({ count }: GenerateProblemsRequest): Promise<GenerateProblemsResponse>;
}
//# sourceMappingURL=agent.d.ts.map