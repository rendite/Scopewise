// API used by the client-facing survey app. Kept separate from the dashboard
// API so the survey bundle stays small.
import { request } from "./http.ts";
import { createMockSurveyApi } from "./mocks/surveyMock.ts";
import type { AnswerRequest, PublicSurvey, TurnResponse } from "./types.ts";

export interface SurveyApi {
  getSurvey(token: string): Promise<PublicSurvey>;
  start(token: string): Promise<TurnResponse>;
  answer(token: string, body: AnswerRequest): Promise<TurnResponse>;
}

const base = (token: string) => `/api/public/surveys/${encodeURIComponent(token)}`;

const httpSurveyApi: SurveyApi = {
  getSurvey: (token) => request("GET", base(token)),
  start: (token) => request("POST", `${base(token)}/start`),
  answer: (token, body) => request("POST", `${base(token)}/answers`, body),
};

export function createSurveyApi(useMocks: boolean): SurveyApi {
  return useMocks ? createMockSurveyApi() : httpSurveyApi;
}

export { ApiError } from "./http.ts";
export type * from "./types.ts";
