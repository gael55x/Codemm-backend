import { z } from "zod";
export declare const CODEMM_SPEC_VERSION: "1.0";
export declare const ActivityLanguageSchema: z.ZodEnum<["java"]>;
export type ActivityLanguage = z.infer<typeof ActivityLanguageSchema>;
export declare const DifficultySchema: z.ZodEnum<["easy", "medium", "hard"]>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export declare const DifficultyPlanItemSchema: z.ZodObject<{
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    count: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}, {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}>;
export declare const DifficultyPlanSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    count: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}, {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}>, "many">, {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}[], {
    count: number;
    difficulty: "easy" | "medium" | "hard";
}[]>;
export declare const ActivitySpecSchema: z.ZodEffects<z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    language: z.ZodEnum<["java"]>;
    problem_count: z.ZodNumber;
    difficulty_plan: z.ZodEffects<z.ZodArray<z.ZodObject<{
        difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
        count: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }, {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }>, "many">, {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[], {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[]>;
    topic_tags: z.ZodArray<z.ZodString, "many">;
    problem_style: z.ZodString;
    constraints: z.ZodString;
    test_case_count: z.ZodLiteral<8>;
}, "strict", z.ZodTypeAny, {
    version: "1.0";
    language: "java";
    problem_count: number;
    difficulty_plan: {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[];
    topic_tags: string[];
    problem_style: string;
    constraints: string;
    test_case_count: 8;
}, {
    version: "1.0";
    language: "java";
    problem_count: number;
    difficulty_plan: {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[];
    topic_tags: string[];
    problem_style: string;
    constraints: string;
    test_case_count: 8;
}>, {
    version: "1.0";
    language: "java";
    problem_count: number;
    difficulty_plan: {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[];
    topic_tags: string[];
    problem_style: string;
    constraints: string;
    test_case_count: 8;
}, {
    version: "1.0";
    language: "java";
    problem_count: number;
    difficulty_plan: {
        count: number;
        difficulty: "easy" | "medium" | "hard";
    }[];
    topic_tags: string[];
    problem_style: string;
    constraints: string;
    test_case_count: 8;
}>;
export type ActivitySpec = z.infer<typeof ActivitySpecSchema>;
export declare function createEmptyActivitySpec(): ActivitySpec;
//# sourceMappingURL=activitySpec.d.ts.map