# Architecture (Backend Agentic Design)

This backend is built around a deterministic “SpecBuilder” agent loop plus a guarded generation pipeline:

- The LLM *proposes* spec changes and per-problem drafts.
- Deterministic code *decides* what becomes persisted state via contracts, invariants, and verification.

## High-level components

- **HTTP API (Express)**: `src/server.ts`, `src/routes/sessions.ts`
- **Session orchestration (state machine + DB)**: `src/services/sessionService.ts`
- **Agent loop (SpecBuilder)**: `src/agent/*`
- **Deterministic compiler boundary**: `src/compiler/*`
- **Generation pipeline**: `src/planner/*`, `src/generation/*`
- **Language adapters (run/judge + rules)**: `src/languages/*`
- **LLM client** (OpenAI-compatible): `src/infra/llm/codex.ts`
- **Persistence** (SQLite): `src/database.ts` → `data/codem.db`

## SpecBuilder loop (chat → ActivitySpec)

The `/sessions/:id/messages` endpoint runs one loop step:

1) **Collector buffer** groups user messages under a stable `questionKey` (prevents “half answers” from being treated as new intent).
   - `src/agent/questionKey.ts`
2) **Intent inference** calls the LLM to produce a constrained JSON object:
   - `src/agent/intentResolver.ts`
   - Output is `inferredPatch` + `confidence` + optional `clarificationQuestion`
3) **Robust parsing** tolerates minor JSON issues (JSON → JSON5 → jsonrepair):
   - `src/utils/jsonParser.ts`
4) **Deterministic patch application** converts `inferredPatch` → JSON Patch ops and applies them:
   - `src/compiler/jsonPatch.ts`
5) **Invariants** are enforced immediately (non-negotiable fields):
   - `src/compiler/specDraft.ts` (`ensureFixedFields()`)
   - Examples: `version=1.0`, `test_case_count=8`, language-specific `constraints`
6) **Commitments** persist “locked” decisions (explicit user signals stay stable across turns):
   - `src/agent/commitments.ts`
7) **Readiness gates + next question** decide whether the spec is complete enough to generate, and what to ask next:
   - `src/agent/readiness.ts`, `src/agent/conversationGoals.ts`, `src/agent/promptGenerator.ts`

## Deterministic boundaries (why it’s “agentic”, but safe)

- The agent never directly mutates persisted session state; it emits proposals that are validated and applied deterministically.
- The draft spec is always locally correct *for any fields that are present* (partial specs are allowed, invalid fields are not).
  - `ActivitySpecDraftSchema` in `src/compiler/specDraft.ts`

## Generation pipeline (ActivitySpec → persisted problems)

When a session is `READY`, `POST /sessions/:id/generate` runs:

1) **Contract validation** for the full `ActivitySpec`: `src/contracts/activitySpec.ts`
2) **Plan derivation**: `deriveProblemPlan()` creates deterministic “slots” (difficulty/topics/style constraints per problem)
   - `src/planner/index.ts`
3) **Per-slot generation**: each slot calls the LLM to generate a `GeneratedProblemDraft`
   - `src/generation/perSlotGenerator.ts`
4) **Problem contract validation** (strict Zod): `src/contracts/problem.ts`
5) **Docker verification**: compile + run tests against a generated reference artifact
   - `src/generation/referenceSolutionValidator.ts`
6) **Safety rule**: reference artifacts are discarded before persistence (only learner-facing fields are stored).

Progress events are published over SSE:
- `GET /sessions/:id/generate/stream` via `src/generation/progressBus.ts`

## Execution and judging (Docker sandbox)

- `/run`: terminal-style execution, no tests, no persistence
- `/submit`: graded execution, requires a test suite; persists submissions when authenticated

Adapters and constraints live under `src/languages/*` (e.g., JUnit 5 rules for Java, pytest rules for Python).

## Diagrams

See `AGENTIC_PLATFORM.md` for end-to-end Mermaid diagrams of the platform and the agent logic.

