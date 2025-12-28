# Tests

Codemm backend uses Node's built-in test runner (`node:test`) with CommonJS test files and `ts-node/register` for importing TypeScript sources.

## Structure

- `test/unit/`: pure/unit tests (no Docker required).
- `test/integration/`: tests that touch the DB or multiple modules together.
- `test/helpers/`: shared test setup helpers.

## Commands

- `npm test`: run all tests.
- `npm run test:unit`: run unit tests only.
- `npm run test:integration`: run integration tests only.

## Conventions

- Prefer deterministic tests (no network, no real LLM calls, no Docker).
- When you need the DB, use `require("../helpers/setupDb")` so `CODEMM_DB_PATH=":memory:"` is set before importing `src/database`.
