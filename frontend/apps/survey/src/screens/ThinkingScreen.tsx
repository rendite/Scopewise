import { useEffect, useState } from "react";

const phrases = ["Thinking about your answer…", "Preparing the next question…", "Almost there…"];

interface Props {
  /** Fixed label; when omitted, cycles through calm "thinking" phrases. */
  label?: string;
}

export function ThinkingScreen({ label }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (label) return;
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, phrases.length - 1)), 2200);
    return () => clearInterval(timer);
  }, [label]);

  return (
    <section className="screen thinking" aria-live="polite" aria-busy="true">
      <span className="dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <p className="thinking-label">{label ?? phrases[index]}</p>
    </section>
  );
}
