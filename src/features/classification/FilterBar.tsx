import { INQUIRY_CATEGORIES, SENTIMENTS } from "../../types/jev";
import { labelFor } from "./resultViews";
import type { FilterState } from "./filterTypes";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  function patch(p: Partial<FilterState>) {
    onChange({ ...filters, ...p });
  }

  return (
    <div className="filters-bar">
      <div className="form-row">
        <label>유형</label>
        <select value={filters.category} onChange={(e) => patch({ category: e.target.value })}>
          <option value="all">전체</option>
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {labelFor(c)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>감정</label>
        <select value={filters.sentiment} onChange={(e) => patch({ sentiment: e.target.value })}>
          <option value="all">전체</option>
          {SENTIMENTS.map((s) => (
            <option key={s} value={s}>
              {labelFor(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>처리 상태</label>
        <select value={filters.status} onChange={(e) => patch({ status: e.target.value as FilterState["status"] })}>
          <option value="all">전체</option>
          <option value="waiting">대기</option>
          <option value="analyzing">분석 중</option>
          <option value="generating_reply">답변 생성 중</option>
          <option value="done">완료</option>
          <option value="needs_review">검토 필요</option>
          <option value="failed">실패</option>
        </select>
      </div>
      <div className="form-row">
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={filters.urgentOnly} onChange={(e) => patch({ urgentOnly: e.target.checked })} />
          긴급만
        </label>
      </div>
      <div className="form-row">
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={filters.needsReviewOnly}
            onChange={(e) => patch({ needsReviewOnly: e.target.checked })}
          />
          사람 검토 필요만
        </label>
      </div>
      <div className="form-row" style={{ minWidth: 220 }}>
        <label>키워드 검색</label>
        <input
          type="text"
          value={filters.keyword}
          onChange={(e) => patch({ keyword: e.target.value })}
          placeholder="문의 내용 검색"
        />
      </div>
    </div>
  );
}
