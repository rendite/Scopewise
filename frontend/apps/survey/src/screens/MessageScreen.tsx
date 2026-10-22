import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "success";
  action?: { label: string; onClick: () => void };
}

export function MessageScreen({ title, children, tone = "neutral", action }: Props) {
  return (
    <section className="screen message" data-tone={tone}>
      {tone === "success" && (
        <span className="check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <h1 className="question-text">{title}</h1>
      <p className="message-body">{children}</p>
      {action && (
        <button className="button primary" type="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </section>
  );
}
