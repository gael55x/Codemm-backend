import type { LanguageId, LanguageProfile } from "./types";
export declare const LANGUAGE_PROFILES: Record<LanguageId, LanguageProfile>;
export declare function listAgentSelectableLanguages(): LanguageId[];
export declare function getLanguageProfile(language: LanguageId): LanguageProfile;
export declare function isLanguageSupportedForGeneration(language: LanguageId): boolean;
export declare function isLanguageSupportedForJudge(language: LanguageId): boolean;
export declare function isLanguageSupportedForExecution(language: LanguageId): boolean;
//# sourceMappingURL=profiles.d.ts.map