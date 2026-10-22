import { createSurveyApi } from "@scopewise/shared/survey";

export const api = createSurveyApi(import.meta.env.VITE_USE_MOCKS === "true");

/** Reads the survey token from a URL like /s/{token}. */
export function tokenFromPath(pathname: string): string | null {
  const match = /^\/s\/([^/]+)\/?$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
