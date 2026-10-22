import type { SurveyStatus } from "@scopewise/shared/dashboard";

const labels: Record<SurveyStatus, string> = {
  draft: "Draft",
  sent: "Waiting for client",
  inProgress: "In progress",
  completed: "Briefing ready",
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span className="badge" data-status={status}>
      {labels[status]}
    </span>
  );
}
