import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { projectTypeLabels, type SurveyDetail } from "@scopewise/shared/dashboard";
import { api } from "../api.ts";
import { CopyLink } from "../components/CopyLink.tsx";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { formatDate } from "../format.ts";

export function SurveyDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSurvey(id)
      .then(setSurvey, (err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load the survey."),
      );
  }, [id]);

  const remove = async () => {
    if (
      !survey ||
      !window.confirm(`Delete the survey for ${survey.clientName}? This cannot be undone.`)
    )
      return;
    await api.deleteSurvey(survey.id);
    navigate("/");
  };

  if (error) return <p className="form-error">{error}</p>;
  if (!survey) return <p className="muted">Loading…</p>;

  const { briefing } = survey;

  return (
    <>
      <Link to="/" className="back">
        ← All surveys
      </Link>
      <div className="page-header">
        <div>
          <h1>{survey.clientName}</h1>
          <p className="muted">
            {projectTypeLabels[survey.projectType]} · created {formatDate(survey.createdAt)}
            {survey.clientEmail && <> · {survey.clientEmail}</>}
          </p>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      {!briefing && (
        <section className="card">
          <h2>Survey link</h2>
          <p className="muted">
            {survey.status === "inProgress"
              ? "Your client is answering the questions right now."
              : "Your client hasn’t finished yet. Share this link with them:"}
          </p>
          <CopyLink link={survey.link} />
        </section>
      )}

      {briefing && (
        <article className="briefing">
          <section className="card summary">
            <h2>Summary</h2>
            <p>{briefing.summary}</p>
            {survey.completedAt && (
              <p className="muted small">Completed {formatDate(survey.completedAt)}</p>
            )}
          </section>
          <div className="briefing-grid">
            {briefing.sections.map((section) => (
              <section key={section.key} className="card">
                <h2>{section.title}</h2>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {briefing.openQuestions.length > 0 && (
            <section className="card open-questions">
              <h2>Open questions for the client</h2>
              <ul>
                {briefing.openQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}

      <div className="danger-zone">
        <button className="btn ghost danger" type="button" onClick={() => void remove()}>
          Delete survey
        </button>
      </div>
    </>
  );
}
