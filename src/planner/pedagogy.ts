import type { LearningMode } from "../contracts/learningMode";

/**
 * Extension point for future "Guided Mode" pedagogy without changing
 * generation safety/verification behavior.
 *
 * Phase 1: policy is a no-op placeholder (mode-aware, but does not alter slots yet).
 */
export type PedagogyPolicy =
  | { mode: Extract<LearningMode, "guided"> }
  | { mode: Extract<LearningMode, "practice"> };

