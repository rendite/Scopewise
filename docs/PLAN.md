# Scopewise – Plan

Status as of 2026-10-22. Each task below is also a GitHub Issue
(see the [issue list](https://github.com/rendite/Scopewise/issues)); the
issue is the place to discuss and track it. Update this file when phases
change, not for every small task.

## Goal for the first version (MVP)

An agency can sign up, create a survey for a client with a project type and
its branding, send the link, and read a structured briefing once the client
has finished a 10–15 minute adaptive interview.

## Suggested split between the three of us

To avoid stepping on each other's toes, each person owns one stream:

| Stream                | Folder(s)                       | Focus                                       |
| --------------------- | ------------------------------- | ------------------------------------------- |
| **A – Frontend**      | `frontend/`                     | Survey page, dashboard UI                   |
| **B – Backend core**  | `backend/` (Data, Auth, Surveys)| Database, login, survey CRUD                |
| **C – AI engine**     | `backend/src/Scopewise.Interview` | Prompts, Gemini integration, briefing     |

Streams B and C both work in `backend/` but in different feature folders.
Agree on names who takes which stream and note it here.

## Phases

### Phase 0 – Team infrastructure ✅

- [x] Repo structure: `backend/`, `frontend/`, `docs/`
- [x] ASP.NET Core skeleton with health endpoint and test
- [x] Local PostgreSQL via Docker Compose
- [x] CI (GitHub Actions) for backend and frontend
- [x] PR + issue templates, branch protection on `main`
- [x] README, CONTRIBUTING, CLAUDE.md, API contract, architecture

### Phase 1 – Foundations (parallel, against mocks)

| #  | Task                                                                 | Stream |
| -- | -------------------------------------------------------------------- | ------ |
| 1  | Frontend workspace: Vite apps `dashboard` + `survey`, shared package, lint/typecheck, mocks | A |
| 2  | Survey UI: welcome → one-question-per-screen → thank-you, with mock interview | A |
| 3  | Dashboard UI shell: login page, survey list, create-survey dialog, survey detail (mock data) | A |
| 4  | EF Core + Npgsql setup, first migration (Agency, User, Survey, InterviewTurn, Briefing) | B |
| 5  | ASP.NET Identity with cookie auth: register/login/logout/me endpoints | B |
| 6  | Interview engine: system prompt + Gemini call that returns coverage/next question/done as structured output; InterviewLab console with chat + 3 simulated clients | C |

### Phase 2 – Core features

| #  | Task                                                                 | Stream |
| -- | -------------------------------------------------------------------- | ------ |
| 7  | Survey CRUD endpoints (`/api/surveys`), unguessable tokens, agency scoping | B |
| 8  | Public survey endpoints (`/api/public/surveys/{token}`, `/start`, `/answers`) wired to the interview engine | B + C |
| 9  | Project-type specific interview guides (website, webshop, web app, mobile app, custom) | C |
| 10 | Briefing generation at interview end (structured output → `Briefing`) | C |
| 11 | Branding endpoints + logo upload; survey page uses agency colors/logo | B + A |
| 12 | Connect dashboard + survey to the real API (turn mocks off), auth flow | A |

### Phase 3 – Polish for first pilot agencies

| #  | Task                                                                 | Stream |
| -- | -------------------------------------------------------------------- | ------ |
| 13 | Briefing view in dashboard + export (Markdown/PDF)                   | A |
| 14 | Resume an interrupted survey; handle double submits and LLM errors gracefully | B + C |
| 15 | Prompt evaluation set: 10 realistic fake clients, check interview quality, length (10–15 min) and briefing completeness | C |
| 16 | Email the survey link to the client (optional, otherwise copy link)  | B |
| 17 | Rate limiting + abuse protection on public endpoints                 | B |

### Phase 4 – Go live (decisions needed)

| #  | Task                                                                 | Stream |
| -- | -------------------------------------------------------------------- | ------ |
| 18 | Decide hosting (e.g. Azure, Render, Fly.io, Hetzner) and set up deployment | all |
| 19 | GDPR: privacy policy, data processing agreements (hosting, Google), EU data location, data deletion; move from Gemini free tier to paid tier before real client data | all |
| 20 | Billing / subscriptions (e.g. Stripe)                                | B |
| 21 | Multi-language surveys (German first?)                               | A + C |

## Open questions

- Pricing model (per seat, per survey, flat)?
- Should agencies edit the briefing before sharing it with their team?
- Which Gemini model gives the best quality/latency trade-off for interview
  turns? Measure with `InterviewLab simulate --models a,b`, then decide.
- Do the Gemini free-tier terms allow our use? Check data use and EU rules
  before any real client data goes through it (#19).
