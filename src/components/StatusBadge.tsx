import type { ReactElement } from "react";
import type { RowStatus } from "../types/pipeline";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, SpinnerIcon, XCircleIcon } from "./icons";

const STATUS_META: Record<RowStatus, { label: string; className: string; icon: ReactElement }> = {
  waiting: { label: "대기", className: "badge-neutral", icon: <ClockIcon /> },
  analyzing: { label: "분석 중", className: "badge-choice", icon: <SpinnerIcon /> },
  generating_reply: { label: "답변 생성 중", className: "badge-choice", icon: <SpinnerIcon /> },
  done: { label: "완료", className: "badge-success", icon: <CheckCircleIcon /> },
  needs_review: { label: "검토 필요", className: "badge-warning", icon: <AlertTriangleIcon /> },
  failed: { label: "실패", className: "badge-danger", icon: <XCircleIcon /> },
};

export function StatusBadge({ status }: { status: RowStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${meta.className}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}
