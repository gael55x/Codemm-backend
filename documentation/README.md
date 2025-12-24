# Codem Backend Documentation

This directory contains the backend’s design + operational docs. The main project README is `../README.md`.

## Start here

- Architecture overview: `architecture.md`
- API reference + examples: `api.md`
- Local development / ops: `development.md`
- End-to-end diagrams (Mermaid): `AGENTIC_PLATFORM.md`

## Glossary (quick)

- **`ActivitySpec`**: the “what to generate” contract (language, problem_count, difficulty_plan, topic_tags, etc.).
- **Learning Mode**: user-facing pedagogy setting (`practice` | `guided`) that does not change safety/verification.
- **SpecBuilder**: the deterministic agent loop that turns chat → `ActivitySpec`.
- **Commitments**: persisted “locked” decisions so the agent doesn’t churn/flip-flop.
- **Reference artifacts**: generator-only code used to validate tests in Docker; never persisted.
