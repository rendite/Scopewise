import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Question } from "@scopewise/shared/survey";

interface Props {
  question: Question;
  /** Shown when sending the previous attempt failed; the answer is kept. */
  error: string | null;
  onSubmit: (answer: string) => void;
}

const skipAnswer = "I'm not sure / I don't know yet.";

export function QuestionScreen({ question, error, onSubmit }: Props) {
  const draftKey = `scopewise-draft-${question.id}`;
  const [answer, setAnswer] = useState(() => readDraft(draftKey));
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textarea.current?.focus();
  }, []);

  // Grow the textarea with its content instead of showing a scrollbar.
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    writeDraft(draftKey, answer);
  }, [answer, draftKey]);

  const send = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    writeDraft(draftKey, "");
    onSubmit(trimmed);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(answer);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(answer);
    }
  };

  return (
    <form className="screen question" onSubmit={handleSubmit}>
      <h1 className="question-text" id="question-text" aria-live="polite">
        {question.text}
      </h1>
      {question.hint && <p className="hint">{question.hint}</p>}

      <textarea
        ref={textarea}
        className="answer"
        aria-labelledby="question-text"
        placeholder="Type your answer…"
        rows={1}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      {error && (
        <p className="error" role="alert">
          {error} Please try again.
        </p>
      )}

      <div className="actions">
        <button className="button link" type="button" onClick={() => send(skipAnswer)}>
          Not sure? Skip
        </button>
        <button className="button primary" type="submit" disabled={!answer.trim()}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="keyboard-tip">
        Press <kbd>Enter</kbd> to continue · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
      </p>
    </form>
  );
}

function readDraft(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode); drafts are a convenience only.
  }
}
