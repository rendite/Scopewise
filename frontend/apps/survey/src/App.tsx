import { useEffect, useState, type CSSProperties } from "react";
import { ApiError, type PublicSurvey, type Question } from "@scopewise/shared/survey";
import { api, tokenFromPath } from "./api.ts";
import { Header } from "./screens/Header.tsx";
import { MessageScreen } from "./screens/MessageScreen.tsx";
import { QuestionScreen } from "./screens/QuestionScreen.tsx";
import { ThinkingScreen } from "./screens/ThinkingScreen.tsx";
import { WelcomeScreen } from "./screens/WelcomeScreen.tsx";

type Phase =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error"; message: string }
  | { kind: "welcome" }
  | { kind: "thinking" }
  | { kind: "question"; question: Question; error: string | null }
  | { kind: "done" };

const token = tokenFromPath(window.location.pathname);

export function App() {
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [phase, setPhase] = useState<Phase>(token ? { kind: "loading" } : { kind: "notFound" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!token) return;
    api
      .getSurvey(token)
      .then((loaded) => {
        setSurvey(loaded);
        document.title = `${loaded.branding.agencyName} – your project`;
        setPhase(loaded.status === "completed" ? { kind: "done" } : { kind: "welcome" });
      })
      .catch((error: unknown) => {
        setPhase(
          error instanceof ApiError && error.status === 404
            ? { kind: "notFound" }
            : { kind: "error", message: errorMessage(error) },
        );
      });
  }, []);

  const start = async () => {
    if (!token) return;
    setPhase({ kind: "thinking" });
    try {
      const turn = await api.start(token);
      setProgress(turn.progress);
      setPhase(
        turn.done || !turn.question
          ? { kind: "done" }
          : { kind: "question", question: turn.question, error: null },
      );
    } catch (error) {
      setPhase({ kind: "error", message: errorMessage(error) });
    }
  };

  const submit = async (question: Question, answer: string) => {
    if (!token) return;
    setPhase({ kind: "thinking" });
    try {
      const turn = await api.answer(token, { questionId: question.id, answer });
      setProgress(turn.progress);
      setPhase(
        turn.done || !turn.question
          ? { kind: "done" }
          : { kind: "question", question: turn.question, error: null },
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Out of sync (e.g. answered in another tab): resume at the current question.
        await start();
        return;
      }
      setPhase({ kind: "question", question, error: errorMessage(error) });
    }
  };

  const brandStyle = survey
    ? ({ "--brand": survey.branding.primaryColor } as CSSProperties)
    : undefined;
  const showProgress = phase.kind === "question" || phase.kind === "thinking";

  return (
    <div className="page" style={brandStyle}>
      <Header branding={survey?.branding ?? null} progress={showProgress ? progress : null} />
      <main className="stage">{renderPhase()}</main>
    </div>
  );

  function renderPhase() {
    switch (phase.kind) {
      case "loading":
        return <ThinkingScreen label="Loading…" />;
      case "notFound":
        return (
          <MessageScreen title="This link doesn't work">
            Please open the exact link you received, or ask the agency to send you a new one.
          </MessageScreen>
        );
      case "error":
        return (
          <MessageScreen
            title="Something went wrong"
            action={{ label: "Try again", onClick: () => window.location.reload() }}
          >
            {phase.message} Your answers so far are saved.
          </MessageScreen>
        );
      case "welcome":
        return survey && <WelcomeScreen survey={survey} onStart={start} />;
      case "thinking":
        return <ThinkingScreen />;
      case "question":
        return (
          <QuestionScreen
            key={phase.question.id}
            question={phase.question}
            error={phase.error}
            onSubmit={(answer) => submit(phase.question, answer)}
          />
        );
      case "done":
        return (
          <MessageScreen title="Thank you!" tone="success">
            {survey?.branding.agencyName ?? "The agency"} now has a clear picture of your project
            and will get back to you soon. You can close this page.
          </MessageScreen>
        );
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}
