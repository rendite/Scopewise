import type { Branding } from "@scopewise/shared/survey";

interface Props {
  branding: Branding | null;
  /** 0–1, or null to hide the bar. */
  progress: number | null;
}

export function Header({ branding, progress }: Props) {
  return (
    <header className="header">
      <div
        className="progress"
        role="progressbar"
        aria-label="Survey progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress === null ? undefined : Math.round(progress * 100)}
        data-hidden={progress === null}
      >
        <div
          className="progress-fill"
          style={{ transform: `scaleX(${Math.max(progress ?? 0, 0.03)})` }}
        />
      </div>
      {branding && (
        <div className="agency">
          {branding.logoUrl ? (
            <img className="agency-logo" src={branding.logoUrl} alt="" />
          ) : (
            <span className="agency-mark" aria-hidden="true">
              {branding.agencyName.charAt(0)}
            </span>
          )}
          <span className="agency-name">{branding.agencyName}</span>
        </div>
      )}
    </header>
  );
}
