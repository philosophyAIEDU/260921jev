import type { InquiryRecord } from "../../types/pipeline";
import { labelFor } from "./resultViews";

export function Dashboard({ records }: { records: InquiryRecord[] }) {
  const total = records.length;
  const urgent = records.filter((r) => r.policy?.isUrgent).length;
  const needsReview = records.filter((r) => r.status === "needs_review").length;
  const doneReplies = records.filter((r) => r.geminiReply && !r.geminiReply.fallbackText).length;
  const failed = records.filter((r) => r.status === "failed").length;

  const byCategory = countBy(records, (r) => r.jevResult?.category.choice);
  const bySentiment = countBy(records, (r) => r.jevResult?.sentiment.choice);

  return (
    <div className="card">
      <h2 className="card-title">대시보드</h2>
      <div className="grid grid-5" style={{ marginBottom: 18 }}>
        <div className="stat-tile">
          <div className="stat-tile__label">전체 문의</div>
          <div className="stat-tile__value">{total}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">긴급 문의</div>
          <div className="stat-tile__value danger">{urgent}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">사람 검토 필요</div>
          <div className="stat-tile__value warning">{needsReview}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">답변 생성 완료</div>
          <div className="stat-tile__value">{doneReplies}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">실패</div>
          <div className="stat-tile__value danger">{failed}</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>유형별 건수</h3>
          <BreakdownList counts={byCategory} />
        </div>
        <div>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>감정별 건수</h3>
          <BreakdownList counts={bySentiment} />
        </div>
      </div>
    </div>
  );
}

function countBy(records: InquiryRecord[], getKey: (r: InquiryRecord) => string | undefined) {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = getKey(r);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function BreakdownList({ counts }: { counts: [string, number][] }) {
  if (counts.length === 0) return <p className="text-muted" style={{ fontSize: 13 }}>아직 분석된 결과가 없습니다.</p>;
  const max = Math.max(...counts.map(([, v]) => v));
  return (
    <div>
      {counts.map(([key, value]) => (
        <div className="prob-bar-row" key={key}>
          <span className="prob-bar-row__label">{labelFor(key)}</span>
          <span className="prob-bar-row__track">
            <span className="prob-bar-row__fill" style={{ width: `${(value / max) * 100}%` }} />
          </span>
          <span className="prob-bar-row__value">{value}건</span>
        </div>
      ))}
    </div>
  );
}
