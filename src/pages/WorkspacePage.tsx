import { useMemo, useState } from "react";
import type { InquiryRecord } from "../types/pipeline";
import type { AppMode } from "../components/Header";
import { Dashboard } from "../features/classification/Dashboard";
import { FilterBar } from "../features/classification/FilterBar";
import { InquiryTable } from "../features/classification/InquiryTable";
import { DetailPanel } from "../features/classification/DetailPanel";
import { filterRecords } from "../features/classification/filterRecords";
import { DEFAULT_FILTERS } from "../features/classification/filterTypes";
import { FlowDiagram } from "../features/learning/FlowDiagram";
import { exportToCsv, exportToExcel } from "../lib/export/exportRows";
import { AlertTriangleIcon } from "../components/icons";

interface WorkspaceProps {
  mode: AppMode;
  records: InquiryRecord[];
  running: boolean;
  onAbort: () => void;
  onRetryFailed: () => void;
  onBackToUpload: () => void;
  onRegenerateReply: (rowKey: string) => void;
  regeneratingKey: string | null;
  onEditReply: (rowKey: string, text: string) => void;
  onEditMemo: (rowKey: string, text: string) => void;
  onSetApproval: (rowKey: string, approval: "approved" | "held") => void;
}

export function WorkspacePage(props: WorkspaceProps) {
  const { records, mode } = props;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);
  const selected = records.find((r) => r.inquiry.rowKey === selectedKey) ?? null;

  const waitingCount = records.filter((r) => r.status === "waiting").length;
  const inProgressCount = records.filter((r) => r.status === "analyzing" || r.status === "generating_reply").length;
  const failedCount = records.filter((r) => r.status === "failed").length;
  const doneCount = records.length - waitingCount - inProgressCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 4 }}>
              처리 진행 상황
            </h2>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>
              완료 {doneCount} / 전체 {records.length} (진행 중 {inProgressCount}, 실패 {failedCount})
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary" onClick={props.onBackToUpload}>
              새 파일 업로드
            </button>
            {props.running && (
              <button type="button" className="btn btn-danger" onClick={props.onAbort}>
                중단
              </button>
            )}
            {!props.running && failedCount > 0 && (
              <button type="button" className="btn btn-secondary" onClick={props.onRetryFailed}>
                실패한 행만 다시 시도 ({failedCount})
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => exportToCsv(records)}>
              CSV 내보내기
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => exportToExcel(records)}>
              Excel 내보내기
            </button>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div
            className="progress-bar__fill"
            style={{ width: `${records.length ? (doneCount / records.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <Dashboard records={records} />

      <div className="card">
        <h2 className="card-title">문의 목록</h2>
        <div style={{ marginBottom: 12 }}>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <InquiryTable records={filtered} selectedKey={selectedKey} onSelect={setSelectedKey} />
      </div>

      {selected ? (
        <>
          {mode === "learning" && <FlowDiagram />}
          <DetailPanel
            record={selected}
            mode={mode}
            onEditReply={(text) => props.onEditReply(selected.inquiry.rowKey, text)}
            onEditMemo={(text) => props.onEditMemo(selected.inquiry.rowKey, text)}
            onApprove={() => props.onSetApproval(selected.inquiry.rowKey, "approved")}
            onHold={() => props.onSetApproval(selected.inquiry.rowKey, "held")}
            onRegenerate={() => props.onRegenerateReply(selected.inquiry.rowKey)}
            regenerating={props.regeneratingKey === selected.inquiry.rowKey}
          />
        </>
      ) : (
        <div className="notice-banner info">
          <AlertTriangleIcon />
          <div>목록에서 문의를 선택하면 상세 분석 결과를 확인할 수 있습니다.</div>
        </div>
      )}
    </div>
  );
}
