import { useMemo, useState } from "react";
import type { InquiryRecord } from "../types/pipeline";
import type { AppSettings } from "../types/settings";
import type { AppMode } from "../components/Header";
import type { ReplyTemplate } from "../types/template";
import { Dashboard } from "../features/classification/Dashboard";
import { FilterBar } from "../features/classification/FilterBar";
import { InquiryTable } from "../features/classification/InquiryTable";
import { DetailPanel } from "../features/classification/DetailPanel";
import { filterRecords } from "../features/classification/filterRecords";
import { DEFAULT_FILTERS } from "../features/classification/filterTypes";
import { FlowDiagram } from "../features/learning/FlowDiagram";
import { exportToCsv, exportToExcel } from "../lib/export/exportRows";
import { AlertTriangleIcon, CheckCircleIcon } from "../components/icons";

interface WorkspaceProps {
  mode: AppMode;
  settings: AppSettings;
  records: InquiryRecord[];
  running: boolean;
  pendingCount: number;
  onContinueAnalysis: (limit: number) => void;
  onAbort: () => void;
  onRetryFailed: () => void;
  onBackToUpload: () => void;
  onRegenerateReply: (rowKey: string) => void;
  regeneratingKey: string | null;
  onEditReply: (rowKey: string, text: string) => void;
  onEditMemo: (rowKey: string, text: string) => void;
  onSetApproval: (rowKey: string, approval: "approved" | "held") => void;
  onBulkSetApproval: (rowKeys: string[], approval: "approved" | "held") => void;
  onSetAssignee: (rowKey: string, assignee: string) => void;
  templates: ReplyTemplate[];
  gmailConnected: boolean;
  onSendEmail: (rowKey: string) => void;
  onBulkSendEmail: (rowKeys: string[]) => void;
}

export function WorkspacePage(props: WorkspaceProps) {
  const { records, mode, settings } = props;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);
  const selected = records.find((r) => r.inquiry.rowKey === selectedKey) ?? null;

  const waitingCount = records.filter((r) => r.status === "waiting").length;
  const inProgressCount = records.filter((r) => r.status === "analyzing" || r.status === "generating_reply").length;
  const failedCount = records.filter((r) => r.status === "failed").length;
  const doneCount = records.length - waitingCount - inProgressCount;
  const cachedCount = records.filter((r) => r.fromCache).length;

  function toggleRow(rowKey: string) {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  function toggleAll() {
    setSelectedRowKeys((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((r) => prev.has(r.inquiry.rowKey));
      if (allSelected) return new Set();
      return new Set(filtered.map((r) => r.inquiry.rowKey));
    });
  }

  function bulkApply(approval: "approved" | "held") {
    props.onBulkSetApproval([...selectedRowKeys], approval);
    setSelectedRowKeys(new Set());
  }

  function handleBulkSend() {
    const keys = [...selectedRowKeys];
    const confirmed = window.confirm(
      `선택한 ${keys.length}건 중 이메일 주소와 답변이 준비된 문의에 실제 이메일을 발송합니다. 계속할까요?`
    );
    if (!confirmed) return;
    props.onBulkSendEmail(keys);
    setSelectedRowKeys(new Set());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 4 }}>
              처리 진행 상황
            </h2>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>
              완료 {doneCount} / 이번 배치 {records.length} (진행 중 {inProgressCount}, 실패{" "}
              {failedCount})
              {cachedCount > 0 && ` · 중복 문의 재사용으로 API 호출 ${cachedCount}건 절약`}
              {props.pendingCount > 0 && ` · 대기 중 ${props.pendingCount}건 (미분석, 비용 발생 안 함)`}
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
        {failedCount > 0 && <FailureSummary records={records} />}
      </div>

      {props.pendingCount > 0 && (
        <ContinueAnalysisCard
          pendingCount={props.pendingCount}
          running={props.running}
          onContinue={props.onContinueAnalysis}
        />
      )}

      <Dashboard records={records} />

      <div className="card">
        <h2 className="card-title">문의 목록</h2>
        <div style={{ marginBottom: 12 }}>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {selectedRowKeys.size > 0 && (
          <div className="notice-banner info" style={{ marginBottom: 12, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <CheckCircleIcon />
              <span>{selectedRowKeys.size}건 선택됨</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => bulkApply("approved")}>
                일괄 승인
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => bulkApply("held")}>
                일괄 보류
              </button>
              {props.gmailConnected && (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleBulkSend}>
                  선택 항목 일괄 이메일 발송
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedRowKeys(new Set())}>
                선택 해제
              </button>
            </div>
          </div>
        )}

        <InquiryTable
          records={filtered}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          slaWarningHours={settings.slaWarningHours}
          selectedRowKeys={selectedRowKeys}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
        />
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
            onSetAssignee={(assignee) => props.onSetAssignee(selected.inquiry.rowKey, assignee)}
            slaWarningHours={settings.slaWarningHours}
            templates={props.templates}
            gmailConnected={props.gmailConnected}
            onSendEmail={() => props.onSendEmail(selected.inquiry.rowKey)}
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

/** 나머지 문의를 원하는 건수만큼 이어서 분석할 수 있게 한다 (API 비용 절감을 위해 한 번에 전체를 돌리지 않음) */
function ContinueAnalysisCard({
  pendingCount,
  running,
  onContinue,
}: {
  pendingCount: number;
  running: boolean;
  onContinue: (limit: number) => void;
}) {
  const [limit, setLimit] = useState(() => Math.min(20, pendingCount));

  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: 4 }}>
        분석 대기 중인 문의 {pendingCount}건
      </h2>
      <p className="card-subtitle">
        API 비용 절감을 위해 이번 배치에서 처리하지 않은 문의입니다. 원하는 만큼 이어서
        분석하세요.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="number"
          min={1}
          max={pendingCount}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ width: 100 }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={running || limit < 1}
          onClick={() => onContinue(Math.min(limit, pendingCount))}
        >
          다음 {Math.min(Math.max(limit, 0), pendingCount)}건 이어서 분석
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={running}
          onClick={() => onContinue(pendingCount)}
        >
          남은 전체 이어서 분석
        </button>
      </div>
    </div>
  );
}

/** 실패 사유를 모아서 보여준다. 같은 오류가 여러 건이면 시스템적인 문제일 가능성이 높다는 것을 바로 알 수 있게 한다. */
function FailureSummary({ records }: { records: InquiryRecord[] }) {
  const counts = new Map<string, number>();
  for (const r of records) {
    if (r.status !== "failed") continue;
    const key = r.errorMessage ?? "알 수 없는 오류";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="notice-banner danger" style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangleIcon />
        <div style={{ fontWeight: 700 }}>실패 사유 요약</div>
      </div>
      <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
        {sorted.map(([message, count]) => (
          <li key={message} style={{ fontSize: 13, marginBottom: 2 }}>
            {message} — {count}건
          </li>
        ))}
      </ul>
      {sorted.length === 1 && sorted[0][1] >= 3 && (
        <p style={{ margin: "6px 0 0", fontSize: 12.5 }}>
          동일한 오류가 여러 건 발생했습니다. API Key·모델 설정을 확인하거나, 문제가 반복되면
          "실패한 행만 다시 시도"를 눌러 보세요.
        </p>
      )}
    </div>
  );
}
