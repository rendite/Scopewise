import { useEffect, useState } from "react";
import { Link } from "react-router";
import { projectTypeLabels, type SurveySummary } from "@scopewise/shared/dashboard";
import { api } from "../api.ts";
import { NewSurveyDialog } from "../components/NewSurveyDialog.tsx";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { formatDate } from "../format.ts";

export function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .listSurveys()
      .then(setSurveys, (err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load surveys."),
      );
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Surveys</h1>
          <p className="muted">
            Send a survey link to a client and get a structured briefing back.
          </p>
        </div>
        <button className="btn primary" type="button" onClick={() => setCreating(true)}>
          + New survey
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!surveys && !error && <p className="muted">Loading…</p>}

      {surveys?.length === 0 && (
        <div className="empty">
          <h2>No surveys yet</h2>
          <p className="muted">Create your first survey and send the link to a client.</p>
        </div>
      )}

      {surveys && surveys.length > 0 && (
        <ul className="survey-list">
          {surveys.map((survey) => (
            <li key={survey.id}>
              <Link to={`/surveys/${survey.id}`} className="survey-row">
                <span className="survey-client">{survey.clientName}</span>
                <span className="survey-type muted">{projectTypeLabels[survey.projectType]}</span>
                <StatusBadge status={survey.status} />
                <span className="survey-date muted">{formatDate(survey.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <NewSurveyDialog
          onClose={() => setCreating(false)}
          onCreated={(survey) => setSurveys((list) => [survey, ...(list ?? [])])}
        />
      )}
    </>
  );
}
