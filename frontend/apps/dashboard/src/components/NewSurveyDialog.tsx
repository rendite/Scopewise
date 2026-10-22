import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  projectTypeLabels,
  type ProjectType,
  type SurveyDetail,
} from "@scopewise/shared/dashboard";
import { api } from "../api.ts";
import { CopyLink } from "./CopyLink.tsx";

interface Props {
  onClose: () => void;
  onCreated: (survey: SurveyDetail) => void;
}

export function NewSurveyDialog({ onClose, onCreated }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [created, setCreated] = useState<SurveyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("clientEmail")).trim();
    setBusy(true);
    setError(null);
    try {
      const survey = await api.createSurvey({
        clientName: String(form.get("clientName")).trim(),
        clientEmail: email || null,
        projectType: form.get("projectType") as ProjectType,
      });
      setCreated(survey);
      onCreated(survey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the survey.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialog} className="dialog" onClose={onClose}>
      {created ? (
        <div className="dialog-body">
          <h2>Survey ready</h2>
          <p className="muted">
            Send this link to {created.clientName}. You’ll find the briefing here as soon as they’re
            done.
          </p>
          <CopyLink link={created.link} />
          <div className="dialog-actions">
            <button className="btn primary" type="button" onClick={() => dialog.current?.close()}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="dialog-body" onSubmit={handleSubmit}>
          <h2>New survey</h2>
          <label className="field">
            Client name
            <input name="clientName" required autoFocus placeholder="e.g. Bakery Müller" />
          </label>
          <label className="field">
            Client email <span className="optional">optional</span>
            <input name="clientEmail" type="email" placeholder="hello@client.com" />
          </label>
          <label className="field">
            Project type
            <select name="projectType" defaultValue="website">
              {Object.entries(projectTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button className="btn ghost" type="button" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create survey"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
