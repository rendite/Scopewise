# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Scopewise is a B2B SaaS for web/software agencies. An agency sends its client
a link to an **AI-adaptive survey**; an LLM interviews the client one question
at a time (10–15 min) and Scopewise produces a **structured briefing** for the
agency. Read `docs/ARCHITECTURE.md` for the full picture and `docs/PLAN.md`
for what is being worked on.

## Team & workflow

Three developers work in parallel, all relatively new to Git. Therefore:

- Never commit or push to `main`. Create a branch named
  `feature/<issue>-<name>`, `fix/<issue>-<name>` or `docs/<name>`, and open a PR.
- Keep PRs small and focused on one issue. Do not mix frontend and backend
  changes in one PR unless the task is explicitly about the API contract.
- When explaining Git steps to the user, give the exact commands.
- Follow `CONTRIBUTING.md`.

## Strict frontend/backend separation

- `backend/` and `frontend/` never import from each other. They share only
  the HTTP contract in `docs/API.md`.
- Changing an endpoint means updating, in the same PR: `docs/API.md`, the
  TS types in `frontend/packages/shared/src/types.ts`, and the mock in
  `frontend/packages/shared/src/mocks/`.
- Mark endpoints in `docs/API.md` as 🟢 once implemented in the backend.

## Commands

```bash
# database
docker compose up -d

# backend (from backend/)
dotnet build
dotnet test
dotnet run --project src/Scopewise.Api          # http://localhost:5080
dotnet run --project tools/Scopewise.InterviewLab -- chat       # be the client yourself
dotnet run --project tools/Scopewise.InterviewLab -- simulate   # fictional clients, writes a report
dotnet run --project tools/Scopewise.InterviewLab -- models     # list available Gemini models

# frontend (from frontend/)
npm install
npm run dev              # both apps: dashboard :5173, survey :5174
npm run dev:dashboard
npm run dev:survey
npm run lint
npm run typecheck
npm run build
```

On macOS `dotnet` lives in `/usr/local/share/dotnet` — add it to `PATH` if
the command is not found.

## Backend conventions (C#)

- ASP.NET Core 10, **minimal APIs**, grouped per feature
  (`Features/Surveys/SurveyEndpoints.cs`, `Features/Auth/...`).
- File-scoped namespaces, nullable enabled, `async` all the way.
- EF Core + Npgsql for PostgreSQL; migrations in `src/Scopewise.Api/Data/Migrations`.
- Errors as RFC 9457 problem details (`Results.Problem`).
- Every endpoint gets at least one integration test via
  `WebApplicationFactory<Program>`.
- Secrets only via `dotnet user-secrets` locally / env vars in production.
  Never in `appsettings*.json`.

## LLM integration (interview engine)

- The interview engine is the class library `backend/src/Scopewise.Interview`
  (no ASP.NET dependency). The API registers it with `AddInterview(...)`.
- Provider: **Google Gemini** via the official **`Google.GenAI`** NuGet package,
  hidden behind `ILlmClient` (`Llm/GeminiLlmClient.cs`). Only that class knows
  about Gemini; switching providers means adding another `ILlmClient`.
- All LLM calls happen in the backend only. The API key never reaches the frontend.
  Locally: `dotnet user-secrets set "Gemini:ApiKey" "<key>" --project src/Scopewise.Api`
  (the InterviewLab tool shares this secrets store).
- Models are configuration (`Gemini:Model`, `Interview:Model`, `Interview:BriefingModel`),
  never hard-coded. Compare them with the InterviewLab `simulate` command.
- The engine is stateless: the caller passes all previous turns every time.
  Each turn returns topic coverage, done-flag, next question and hint as
  **structured JSON output** (`Schemas.cs`); progress is computed from coverage.
  Guardrails (min/max questions, retries) live in `InterviewEngine.cs`.
- Briefing generation: one call at the end, structured output, mapped to the
  `Briefing` type in `docs/API.md`.
- Prompts are Markdown files in `src/Scopewise.Interview/Prompts/` (embedded
  resources), not inline strings. Topic checklists per project type live in
  `Prompts/topics/`; their keys must match the `Topic` enum (a test checks this).
- Treat client answers as untrusted input (prompt injection): they go into
  the user message, HTML-encoded inside `<transcript>`, never into the system prompt.
- Unit tests use `FakeLlmClient` and never call a real model. Real-model runs
  are manual (InterviewLab) because they cost quota.
- Free-tier Gemini is fine for development with fictional data only. Real
  client data needs a paid tier (data use / EU terms) – see issue #19.

## Frontend conventions (TypeScript/React)

- npm workspaces: `apps/dashboard`, `apps/survey`, `packages/shared`.
- React 19 + TypeScript (strict) + Vite. Function components and hooks only.
- API calls only through the client in `@scopewise/shared` — no raw `fetch`
  in components.
- `VITE_USE_MOCKS=true` serves mock data so UI work never waits for the backend.
- Styling: plain CSS with CSS custom properties (design tokens in each app's
  `src/styles/tokens.css`). No UI framework in the survey app — it must stay tiny.
- The **survey app** shows exactly one question per screen, never the
  conversation history, with a single text input. Mobile first. Keep it calm
  and simple — it must not feel like a form.

## Language

All code, comments, docs, commit messages and UI text are in **English**.
