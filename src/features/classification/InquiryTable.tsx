import type { InquiryRecord } from "../../types/pipeline";
import { StatusBadge } from "../../components/StatusBadge";
import { ElapsedBadge } from "../../components/ElapsedBadge";
import { labelFor } from "./resultViews";

interface InquiryTableProps {
  records: InquiryRecord[];
  selectedKey: string | null;
  onSelect: (rowKey: string) => void;
  slaWarningHours: number;
  selectedRowKeys: Set<string>;
  onToggleRow: (rowKey: string) => void;
  onToggleAll: () => void;
}

export function InquiryTable({
  records,
  selectedKey,
  onSelect,
  slaWarningHours,
  selectedRowKeys,
  onToggleRow,
  onToggleAll,
}: InquiryTableProps) {
  if (records.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13.5 }}>조건에 맞는 문의가 없습니다.</p>;
  }

  const allSelected = records.length > 0 && records.every((r) => selectedRowKeys.has(r.inquiry.rowKey));

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="전체 선택"
                onClick={(e) => e.stopPropagation()}
              />
            </th>
            <th>문의 ID</th>
            <th>접수일</th>
            <th>채널</th>
            <th>문의 내용</th>
            <th>유형</th>
            <th>감정</th>
            <th>긴급</th>
            <th>심각도</th>
            <th>confidence</th>
            <th>경과</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const isResolved = r.status === "done" || r.approval === "approved";
            return (
              <tr
                key={r.inquiry.rowKey}
                className={selectedKey === r.inquiry.rowKey ? "is-selected" : ""}
                onClick={() => onSelect(r.inquiry.rowKey)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRowKeys.has(r.inquiry.rowKey)}
                    onChange={() => onToggleRow(r.inquiry.rowKey)}
                    aria-label="이 문의 선택"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>{r.inquiry.inquiry_id ?? "-"}</td>
                <td>{r.inquiry.received_at ?? "-"}</td>
                <td>{r.inquiry.channel ?? "-"}</td>
                <td style={{ maxWidth: 280 }}>{r.inquiry.inquiry_text.slice(0, 60)}</td>
                <td>{r.jevResult ? labelFor(r.jevResult.category.choice) : "-"}</td>
                <td>{r.jevResult ? labelFor(r.jevResult.sentiment.choice) : "-"}</td>
                <td className="tabular-nums">{r.jevResult ? `${(r.jevResult.is_urgent * 100).toFixed(0)}%` : "-"}</td>
                <td className="tabular-nums">{r.jevResult ? r.jevResult.severity.score.toFixed(2) : "-"}</td>
                <td className="tabular-nums">
                  {r.jevResult ? `${(r.jevResult.category.confidence * 100).toFixed(0)}%` : "-"}
                </td>
                <td>
                  <ElapsedBadge
                    receivedAt={r.inquiry.received_at}
                    warningHours={slaWarningHours}
                    isResolved={isResolved}
                  />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                  {r.fromCache && (
                    <span className="badge badge-neutral" style={{ marginLeft: 4 }} title="동일한 문의 내용을 재사용했습니다">
                      캐시
                    </span>
                  )}
                  {r.emailSendStatus === "sent" && (
                    <span className="badge badge-success" style={{ marginLeft: 4 }} title={r.emailSentAt}>
                      메일 발송됨
                    </span>
                  )}
                  {r.emailSendStatus === "failed" && (
                    <span className="badge badge-danger" style={{ marginLeft: 4 }} title={r.emailError}>
                      메일 발송 실패
                    </span>
                  )}
                  {r.status === "failed" && r.errorMessage && (
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 2, maxWidth: 220 }}>
                      {r.errorMessage}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
