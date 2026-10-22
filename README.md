# Scopewise

When a business needs a website, they face a dilemma: hire an agency and spend
hours explaining their vision, or use AI and fail due to a lack of technical
prompt skills. We are building an AI-adaptive survey for web agencies that
dynamically interviews clients, bridging the gap between AI speed and agency
expertise to cut onboarding time by 80%.

## How it works

1. An **agency** creates a survey in the Scopewise dashboard and sends the
   link to its client.
2. The **client** opens the link and answers one question at a time on a
   clean, calm page. No forms, no chat history. An LLM adapts every follow-up
   question to what the client said before. It takes about 10–15 minutes.
3. Scopewise turns the conversation into a **structured briefing** (goals,
   audience, scope, design, content, technical needs, budget/timeline) that
   the agency can build from right away.

## Repository layout

| Folder                       | What                                           |
| ---------------------------- | ---------------------------------------------- |
| `backend/`                   | ASP.NET Core 10 Web API (C#)                   |
| `frontend/apps/dashboard/`   | Agency dashboard (React + TypeScript + Vite)   |
| `frontend/apps/survey/`      | Client survey page (React + TypeScript + Vite) |
| `frontend/packages/shared/`  | Shared types, API client and mocks             |
| `docs/`                      | [Plan](docs/PLAN.md), [API contract](docs/API.md), [architecture](docs/ARCHITECTURE.md) |

## Getting started

### 1. Install the tools (once)

On macOS with [Homebrew](https://brew.sh):

```bash
brew install git gh node
brew install --cask dotnet-sdk docker-desktop
gh auth login          # GitHub.com → HTTPS → login with browser
```

Then start **Docker Desktop** once from your Applications folder.

Check that everything is there:

```bash
node -v      # v24 or newer
dotnet --version   # 10.x
docker --version
```

On Windows, install [Node.js LTS](https://nodejs.org),
[.NET 10 SDK](https://dotnet.microsoft.com/download),
[Docker Desktop](https://www.docker.com/products/docker-desktop/) and
[GitHub CLI](https://cli.github.com) with their installers.

### 2. Get the code

```bash
git clone https://github.com/rendite/Scopewise.git
cd Scopewise
```

### 3. Start the database

```bash
docker compose up -d
```

PostgreSQL now runs on `localhost:5432` (user/password/db: `scopewise`).
Stop it with `docker compose down`.

### 4. Run the backend

```bash
cd backend
dotnet user-secrets set "Anthropic:ApiKey" "sk-ant-..." --project src/Scopewise.Api   # once, ask the team for a key
dotnet run --project src/Scopewise.Api
```

API: <http://localhost:5080> · health check: <http://localhost:5080/api/health>

Run the tests with `dotnet test`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

| App       | URL                                  |
| --------- | ------------------------------------ |
| Dashboard | <http://localhost:5173>              |
| Survey    | <http://localhost:5174/s/demo>       |

As long as the backend endpoints are not built yet, the apps run against
built-in **mock data** (`VITE_USE_MOCKS=true` in `.env.development`), so
frontend work never waits for the backend.

## Working together

Read **[CONTRIBUTING.md](CONTRIBUTING.md)** before your first change. In short:
never push to `main`; one issue → one branch → one pull request → one review.

Open tasks are tracked as [GitHub Issues](https://github.com/rendite/Scopewise/issues);
the roadmap is in [docs/PLAN.md](docs/PLAN.md).

## Tech stack

React 19 · TypeScript · Vite · ASP.NET Core 10 · EF Core · PostgreSQL ·
ASP.NET Identity · Anthropic Claude API · GitHub Actions
