import { projectTypeLabels } from "@scopewise/shared";
import type { PublicSurvey } from "@scopewise/shared/survey";

interface Props {
  survey: PublicSurvey;
  onStart: () => void;
}

export function WelcomeScreen({ survey, onStart }: Props) {
  const project = projectTypeLabels[survey.projectType].toLowerCase();

  return (
    <section className="screen welcome">
      <p className="eyebrow">Hi {survey.clientName}</p>
      <h1 className="question-text">
        {survey.branding.agencyName} would like to understand your {project} project.
      </h1>
      <ul className="facts">
        <li>About 10–15 minutes</li>
        <li>One question at a time</li>
        <li>There are no wrong answers</li>
      </ul>
      <button className="button primary" type="button" onClick={onStart}>
        Let’s start <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
