import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "./auth.tsx";
import { Layout } from "./components/Layout.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";
import { SurveyDetailPage } from "./pages/SurveyDetailPage.tsx";
import { SurveysPage } from "./pages/SurveysPage.tsx";

export function App() {
  const { user } = useAuth();

  if (user === undefined) {
    return <div className="splash" aria-busy="true" />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SurveysPage />} />
        <Route path="surveys/:id" element={<SurveyDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
