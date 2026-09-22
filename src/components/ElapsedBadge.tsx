import { elapsedHoursSince, formatElapsed, parseReceivedAt } from "../lib/slaUtils";
import { AlertTriangleIcon, ClockIcon } from "./icons";

interface ElapsedBadgeProps {
  receivedAt: string | undefined;
  warningHours: number;
  /** 이미 완료/승인된 건은 SLA 경과를 강조하지 않는다 */
  isResolved: boolean;
}

export function ElapsedBadge({ receivedAt, warningHours, isResolved }: ElapsedBadgeProps) {
  const date = parseReceivedAt(receivedAt);
  if (!date) return <span className="text-muted">-</span>;

  const hours = elapsedHoursSince(date);
  const isOverdue = !isResolved && hours >= warningHours;

  return (
    <span className={`badge ${isOverdue ? "badge-warning" : "badge-neutral"}`}>
      {isOverdue ? <AlertTriangleIcon /> : <ClockIcon />}
      {formatElapsed(hours)}
    </span>
  );
}
