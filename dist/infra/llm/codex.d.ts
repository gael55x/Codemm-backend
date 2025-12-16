import OpenAI from "openai";
export declare function getCodexClient(): OpenAI;
export declare function createCodexCompletion(opts: {
    system: string;
    user: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=codex.d.ts.map