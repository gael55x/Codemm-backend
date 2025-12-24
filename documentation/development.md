# Development & Infrastructure

## Prereqs

- Node 18+
- npm
- Docker Desktop (or dockerd)

## Configure env

From `Codem-backend/`:

- `cp .env.example .env`
- Set:
  - `CODEX_API_KEY` (required for agent/generation)
  - `JWT_SECRET` (required for auth endpoints)

## Run

Recommended (installs deps, builds judge images, starts backend):

- `./run-codem-backend.sh`

Manual:

- `npm install`
- `npm run dev`

## Docker judge images

The backend uses local Docker images for sandboxed execution and grading:

- `codem-java-judge` (`Dockerfile.java-judge`)
- `codem-python-judge` (`Dockerfile.python-judge`)
- `codem-cpp-judge` (`Dockerfile.cpp-judge`)
- `codem-sql-judge` (`Dockerfile.sql-judge`)

Rebuild images:

- `REBUILD_JUDGE=1 ./run-codem-backend.sh`

## Persistence (SQLite)

- DB file: `data/codem.db`
- Tables include: `users`, `sessions`, `activities`, `submissions`

## Key environment variables

Required:
- `CODEX_API_KEY`
- `JWT_SECRET`

Common:
- `PORT` (default `4000`)
- `CODEX_MODEL` (default `gpt-4.1`)
- `CODEX_BASE_URL` (optional; OpenAI-compatible endpoint override)
- `JUDGE_TIMEOUT_MS` (default `15000`, cap `30000`)
- `CODEMM_RUN_TIMEOUT_MS` (default `8000`, cap `30000`)

Tracing / debugging:
- `CODEMM_TRACE=1` enables `GET /sessions/:id/trace` (SSE)
- `CODEMM_TRACE_FULL=1` (more verbose trace events; still sanitized)
- `CODEMM_TRACE_TEST_SUITES=1` includes test suite snippets in trace payloads (debug only)

Generation modes:
- `CODEMM_WORKSPACE_GEN=1` allows Java “workspace mode” generation where enabled by prompts/rules.

