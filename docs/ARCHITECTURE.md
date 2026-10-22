# Architecture

## The product in one picture

```
 Agency (customer)                         Agency's client
 ┌───────────────────┐                     ┌─────────────────────┐
 │ Dashboard app     │                     │ Survey app          │
 │ - create survey   │  link /s/{token}    │ - one question per  │
 │ - copy/send link  │ ──────────────────▶ │   clean screen      │
 │ - read briefings  │                     │ - single text input │
 │ - set branding    │                     │ - 10–15 minutes     │
 └────────┬──────────┘                     └──────────┬──────────┘
          │ JSON over HTTPS (/api)                    │ JSON (/api/public)
          ▼                                           ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ ASP.NET Core API (backend/)                                     │
 │  Auth (Identity) · Surveys · Interview engine · Briefing builder│
 └────────┬───────────────────────────────────────┬────────────────┘
          ▼                                       ▼
   PostgreSQL (EF Core)                   Anthropic Claude API
```

## Repository layout

```
backend/                     ASP.NET Core 10 (C#)
  Scopewise.slnx
  src/Scopewise.Api/         Web API (minimal APIs)
  tests/Scopewise.Api.Tests/ xUnit tests
frontend/                    npm workspaces
  apps/dashboard/            Agency dashboard   – Vite + React + TS (port 5173)
  apps/survey/               Client survey page – Vite + React + TS (port 5174)
  packages/shared/           Types + API client + mocks used by both apps
docs/                        Plan, API contract, architecture
docker-compose.yml           Local PostgreSQL
```

Frontend and backend never import from each other. Their only connection is
the HTTP API described in [API.md](API.md).

## Why two frontend apps?

The survey page is what the agency's *clients* see. It must load instantly
on any phone and contain nothing but the conversation. Keeping it as its own
tiny app means dashboard code, auth and charts never ship to clients, and
the person working on the survey never conflicts with the person working on
the dashboard.

## The adaptive interview

1. The agency creates a survey with a **project type** (website, webshop, …).
   The backend stores it with a random, unguessable `token`.
2. The client opens `/s/{token}` and sees the agency's branding.
3. Each answer is sent with `fetch` in the background; the page never
   reloads. The backend:
   - stores the answer,
   - sends the whole conversation so far plus an **interviewer system prompt**
     (tailored to the project type and a checklist of briefing topics) to
     Claude,
   - receives the next question plus a progress estimate and a flag whether
     enough information has been collected.
4. The survey UI shows **only the current question** on a fresh screen,
   never the history.
5. When done, the backend asks Claude to turn the conversation into a
   structured **briefing** (fixed sections, JSON) and stores it. The agency
   sees it in the dashboard and can export it.

The LLM is only ever called from the backend. The API key never reaches the
browser.

## Key decisions

| Topic       | Decision                                       |
| ----------- | ---------------------------------------------- |
| Frontend    | React + TypeScript + Vite, two apps            |
| Backend     | ASP.NET Core 10 minimal APIs                   |
| Database    | PostgreSQL via EF Core (Npgsql)                |
| Auth        | ASP.NET Identity, cookie auth                  |
| LLM         | Claude via the official `Anthropic` NuGet SDK  |
| Language    | English for code, docs and UI                  |
| Hosting     | Not decided yet (see PLAN.md)                  |
