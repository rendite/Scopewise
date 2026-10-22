// API used by the agency dashboard.
import { ApiError, request } from "./http.ts";
import { createMockDashboardApi } from "./mocks/dashboardMock.ts";
import type {
  Branding,
  CreateSurveyRequest,
  LoginRequest,
  RegisterRequest,
  SurveyDetail,
  SurveySummary,
  User,
} from "./types.ts";

export interface DashboardApi {
  register(body: RegisterRequest): Promise<User>;
  login(body: LoginRequest): Promise<User>;
  logout(): Promise<void>;
  /** Resolves to null when not logged in. */
  me(): Promise<User | null>;

  listSurveys(): Promise<SurveySummary[]>;
  createSurvey(body: CreateSurveyRequest): Promise<SurveyDetail>;
  getSurvey(id: string): Promise<SurveyDetail>;
  deleteSurvey(id: string): Promise<void>;

  getBranding(): Promise<Branding>;
  updateBranding(body: Branding): Promise<Branding>;
}

const httpDashboardApi: DashboardApi = {
  register: (body) => request("POST", "/api/auth/register", body),
  login: (body) => request("POST", "/api/auth/login", body),
  logout: () => request("POST", "/api/auth/logout"),
  me: async () => {
    try {
      return await request<User>("GET", "/api/auth/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },

  listSurveys: () => request("GET", "/api/surveys"),
  createSurvey: (body) => request("POST", "/api/surveys", body),
  getSurvey: (id) => request("GET", `/api/surveys/${encodeURIComponent(id)}`),
  deleteSurvey: (id) => request("DELETE", `/api/surveys/${encodeURIComponent(id)}`),

  getBranding: () => request("GET", "/api/agency/branding"),
  updateBranding: (body) => request("PUT", "/api/agency/branding", body),
};

export function createDashboardApi(useMocks: boolean): DashboardApi {
  return useMocks ? createMockDashboardApi() : httpDashboardApi;
}

export { ApiError };
export * from "./types.ts";
