import type { InquiryRecord } from "../../types/pipeline";
import { StatusBadge } from "../../components/StatusBadge";
import { labelFor } from "./resultViews";

export function InquiryTable({
  records,
  selectedKey,
  onSelect,
}: {
  records: InquiryRecord[];
  selectedKey: string | null;
  onSelect: (rowKey: string) => void;
}) {
  if (records.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13.5 }}>조건에 맞는 문의가 없습니다.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>문의 ID</th>
            <th>접수일</th>
            <th>채널</th>
            <th>문의 내용</th>
            <th>유형</th>
            <th>감정</th>
            <th>긴급</th>
            <th>심각도</th>
            <th>confidence</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr
              key={r.inquiry.rowKey}
              className={selectedKey === r.inquiry.rowKey ? "is-selected" : ""}
              onClick={() => onSelect(r.inquiry.rowKey)}
            >
              <td>{r.inquiry.inquiry_id ?? "-"}</td>
              <td>{r.inquiry.received_at ?? "-"}</td>
              <td>{r.inquiry.channel ?? "-"}</td>
              <td style={{ maxWidth: 280 }}>{r.inquiry.inquiry_text.slice(0, 60)}</td>
              <td>{r.jevResult ? labelFor(r.jevResult.category.choice) : "-"}</td>
              <td>{r.jevResult ? labelFor(r.jevResult.sentiment.choice) : "-"}</td>
              <td>{r.jevResult ? `${(r.jevResult.is_urgent * 100).toFixed(0)}%` : "-"}</td>
              <td>{r.jevResult ? r.jevResult.severity.score.toFixed(2) : "-"}</td>
              <td>{r.jevResult ? `${(r.jevResult.category.confidence * 100).toFixed(0)}%` : "-"}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
