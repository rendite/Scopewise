import { createDashboardApi } from "@scopewise/shared/dashboard";

export const api = createDashboardApi(import.meta.env.VITE_USE_MOCKS === "true");
