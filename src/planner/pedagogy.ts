import type { LearningMode } from "../contracts/learningMode";

/**
 * Planner-level pedagogy policy.
 *
 * This affects how an activity is structured pedagogically (ordering/scaffolding),
 * without changing generation safety contracts or Docker verification.
 *
 * Phase 2A: policy is consumed only to annotate plan slots with optional pedagogy metadata.
 */
export type PedagogyPolicy =
  | { mode: Extract<LearningMode, "practice"> }
  | {
      mode: Extract<LearningMode, "guided">;
      scaffold_curve?: number[];
      focus_concepts?: string[];
      hints_enabled?: boolean;
    };
