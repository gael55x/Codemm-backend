import OpenAI from "openai";
import { GeneratedProblem, OPENAI_MODEL, PROBLEM_AGENT_SYSTEM_PROMPT } from "./config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateProblemsRequest {
  count: number;
}

export interface GenerateProblemsResponse {
  problems: GeneratedProblem[];
  rawText: string;
}

export class ProblemAgent {
  async generateProblems({ count }: GenerateProblemsRequest): Promise<GenerateProblemsResponse> {
    const userPrompt = `Generate ${count} Java OOP problems with test cases.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: PROBLEM_AGENT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
    });

    const text =
      completion.choices[0]?.message?.content ??
      JSON.stringify(completion.choices);

    // TODO: implement robust parsing based on the specified output format
    const problems: GeneratedProblem[] = [];

    return {
      problems,
      rawText: text,
    };
  }
}


