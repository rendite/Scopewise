# API contract

This file is the single source of truth for how the frontend talks to the
backend. Frontend and backend are built independently against it.

- **Change an endpoint → update this file in the same PR**, and update the
  TypeScript types in `frontend/packages/shared/src/types.ts`.
- All endpoints live under `/api`. JSON in, JSON out, `camelCase` fields.
- Timestamps are ISO 8601 strings in UTC.
- Errors use [RFC 9457 problem details](https://www.rfc-editor.org/rfc/rfc9457):
  `{ "type", "title", "status", "detail" }`.

Status: 🟢 implemented · 🟡 planned (frontend mocks it)

---

## Shared types

```ts
type ProjectType = "website" | "webshop" | "webapp" | "mobileApp" | "custom";

type SurveyStatus = "draft" | "sent" | "inProgress" | "completed";

interface Branding {
  agencyName: string;
  logoUrl: string | null;
  primaryColor: string; // hex, e.g. "#4F46E5"
}

interface Question {
  id: string;
  text: string;          // the question shown to the client
  hint: string | null;   // optional small helper text / example answer
}

interface Briefing {
  summary: string;
  sections: BriefingSection[];
  openQuestions: string[];  // things the client could not answer
}

interface BriefingSection {
  key: "goals" | "audience" | "scope" | "design" | "content"
     | "technical" | "budgetTimeline";
  title: string;
  items: string[];
}
```

---

## Survey (public, for the agency's client)

No login. The client is identified by the secret `token` in the survey link
(`https://survey.scopewise.app/s/{token}`).

### 🟡 `GET /api/public/surveys/{token}`

Loads the welcome screen.

```json
{
  "clientName": "Bakery Müller",
  "projectType": "website",
  "status": "sent",
  "branding": { "agencyName": "Pixel & Co", "logoUrl": null, "primaryColor": "#4F46E5" }
}
```

`404` if the token is unknown; `status: "completed"` shows the thank-you screen.

### 🟡 `POST /api/public/surveys/{token}/start`

Starts the interview, or resumes it at the current question if it was started
before (safe to call again after a page reload).

Response: `TurnResponse`

```json
{
  "question": { "id": "q_1", "text": "What should your new website achieve for you?", "hint": "e.g. more bookings, look more professional" },
  "progress": 0.0,
  "done": false
}
```

### 🟡 `POST /api/public/surveys/{token}/answers`

Submits the answer to the current question. The backend asks the LLM for the
next adaptive question and returns it.

Request:

```json
{ "questionId": "q_1", "answer": "We want people to book tables online." }
```

Response: `TurnResponse`. When the interview is finished:

```json
{ "question": null, "progress": 1.0, "done": true }
```

- `progress` is an estimate between 0 and 1 (the interview targets
  10–15 minutes, roughly 12–20 questions).
- `409` if `questionId` is not the current question (e.g. double submit).
- Typical latency is 1–4 s (LLM call), so the frontend shows a calm transition.

---

## Dashboard (agency, requires login)

Cookie-based auth (ASP.NET Identity). In development the Vite dev server
proxies `/api` to the backend, so cookies just work.

### Auth

| Method | Path                  | Body / Response                                   |
| ------ | --------------------- | ------------------------------------------------- |
| 🟡 POST | `/api/auth/register`  | `{ email, password, agencyName }` → `User`       |
| 🟡 POST | `/api/auth/login`     | `{ email, password }` → `User`                   |
| 🟡 POST | `/api/auth/logout`    | → `204`                                          |
| 🟡 GET  | `/api/auth/me`        | → `User` or `401`                                |

```ts
interface User { id: string; email: string; agencyName: string }
```

### Surveys

| Method | Path                         | Body / Response                              |
| ------ | ---------------------------- | -------------------------------------------- |
| 🟡 GET  | `/api/surveys`               | → `SurveySummary[]` (newest first)          |
| 🟡 POST | `/api/surveys`               | `CreateSurveyRequest` → `SurveyDetail`      |
| 🟡 GET  | `/api/surveys/{id}`          | → `SurveyDetail`                            |
| 🟡 DELETE | `/api/surveys/{id}`        | → `204`                                     |

```ts
interface CreateSurveyRequest {
  clientName: string;
  clientEmail: string | null;
  projectType: ProjectType;
}

interface SurveySummary {
  id: string;
  clientName: string;
  projectType: ProjectType;
  status: SurveyStatus;
  createdAt: string;
  completedAt: string | null;
}

interface SurveyDetail extends SurveySummary {
  clientEmail: string | null;
  link: string;               // full URL to send to the client
  briefing: Briefing | null;  // set once status is "completed"
}
```

### Branding

| Method | Path                   | Body / Response          |
| ------ | ---------------------- | ------------------------ |
| 🟡 GET  | `/api/agency/branding` | → `Branding`            |
| 🟡 PUT  | `/api/agency/branding` | `Branding` → `Branding` |

### Health

| Method | Path          | Response             |
| ------ | ------------- | -------------------- |
| 🟢 GET  | `/api/health` | `{ "status": "ok" }` |
