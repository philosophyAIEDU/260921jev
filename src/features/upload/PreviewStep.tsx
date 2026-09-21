import type { ColumnMapping } from "../../types/inquiry";
import type { ParsedInquiry } from "../../types/inquiry";
import { AlertTriangleIcon } from "../../components/icons";
import type { PdfSplitMode } from "../../lib/fileParsers/pdfParser";

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: "inquiry_text", label: "고객 문의 내용", required: true },
  { key: "inquiry_id", label: "문의 ID" },
  { key: "received_at", label: "접수일시" },
  { key: "channel", label: "채널" },
  { key: "customer_name", label: "고객명" },
  { key: "order_id", label: "주문번호" },
  { key: "language", label: "언어" },
];

interface PreviewStepProps {
  workflow: ReturnType<typeof import("./useFileWorkflow").useFileWorkflow>;
  parsedInquiries: ParsedInquiry[];
  usableInquiries: ParsedInquiry[];
  onStartAnalysis: (withReplies: boolean) => void;
  onBack: () => void;
  hasBothKeys: boolean;
}

export function PreviewStep({
  workflow,
  parsedInquiries,
  usableInquiries,
  onStartAnalysis,
  onBack,
  hasBothKeys,
}: PreviewStepProps) {
  const { state, selectSheet, setMapping, setPdfSplitMode } = workflow;
  const emptyCount = parsedInquiries.filter((r) => r.isEmpty).length;
  const duplicateCount = parsedInquiries.filter((r) => r.isDuplicate).length;
  const errorCount = parsedInquiries.filter((r) => r.error).length;
  const overLimit = usableInquiries.length < parsedInquiries.filter((r) => !r.isEmpty).length;

  const mappingComplete = state.mapping?.inquiry_text != null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <h2 className="card-title">파일 미리보기</h2>
        <p className="card-subtitle">{state.fileName}</p>

        {state.fileKind === "excel" && state.sheetNames.length > 1 && (
          <div className="form-row" style={{ maxWidth: 320 }}>
            <label htmlFor="sheet-select">시트 선택</label>
            <select
              id="sheet-select"
              value={state.selectedSheet ?? ""}
              onChange={(e) => selectSheet(e.target.value)}
            >
              {state.sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {state.fileKind === "pdf" && (
          <PdfSplitControls workflow={workflow} onSetMode={setPdfSplitMode} />
        )}

        {state.fileKind !== "pdf" && state.mapping && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>열 매핑</h3>
            {!mappingComplete && (
              <div className="notice-banner danger" style={{ marginBottom: 10 }}>
                <AlertTriangleIcon />
                <div>고객 문의 내용에 해당하는 열을 찾지 못했습니다. 직접 선택해 주세요.</div>
              </div>
            )}
            <div className="grid grid-3">
              {MAPPING_FIELDS.map((field) => (
                <div className="form-row" key={field.key}>
                  <label>
                    {field.label} {field.required && <span style={{ color: "var(--color-danger)" }}>*</span>}
                  </label>
                  <select
                    value={state.mapping?.[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping({
                        ...(state.mapping as ColumnMapping),
                        [field.key]: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(사용 안 함)</option>
                    {state.parseResult?.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">인식된 문의</h2>
        <div className="grid grid-4" style={{ marginBottom: 14 }}>
          <div className="stat-tile">
            <div className="stat-tile__label">전체 행</div>
            <div className="stat-tile__value">{parsedInquiries.length}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">분석 대상</div>
            <div className="stat-tile__value">{usableInquiries.length}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">빈 행 / 중복</div>
            <div className="stat-tile__value">
              {emptyCount} / {duplicateCount}
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">오류 행</div>
            <div className="stat-tile__value danger">{errorCount}</div>
          </div>
        </div>

        {overLimit && (
          <div className="notice-banner" style={{ marginBottom: 12 }}>
            <AlertTriangleIcon />
            <div>최대 200건까지만 분석할 수 있어 이후 행은 제외됩니다.</div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>문의 내용</th>
                <th>채널</th>
                <th>접수일시</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {parsedInquiries.slice(0, 10).map((row, i) => (
                <tr key={row.rowKey}>
                  <td>{i + 1}</td>
                  <td style={{ maxWidth: 420 }}>
                    {row.inquiry_text.slice(0, 120) || <span className="text-muted">(비어 있음)</span>}
                  </td>
                  <td>{row.channel ?? "-"}</td>
                  <td>{row.received_at ?? "-"}</td>
                  <td>
                    {row.isEmpty && <span className="badge badge-neutral">빈 행</span>}
                    {row.isDuplicate && <span className="badge badge-warning">중복</span>}
                    {row.error && <span className="badge badge-danger">{row.error}</span>}
                    {!row.isEmpty && !row.isDuplicate && !row.error && (
                      <span className="badge badge-success">정상</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">분석 시작</h2>
        <p className="card-subtitle">
          분석을 시작하기 전에 예상 API 호출 수를 확인하세요. 파일을 올리는 즉시 자동으로
          호출되지 않습니다.
        </p>
        <div className="grid grid-2" style={{ marginBottom: 14 }}>
          <div className="stat-tile">
            <div className="stat-tile__label">예상 Jev 호출 수</div>
            <div className="stat-tile__value">{usableInquiries.length}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">예상 Gemini 호출 수 (최대)</div>
            <div className="stat-tile__value">{usableInquiries.length}</div>
          </div>
        </div>
        {!hasBothKeys && (
          <div className="notice-banner danger" style={{ marginBottom: 12 }}>
            <AlertTriangleIcon />
            <div>분석을 시작하려면 설정에서 Jev, Gemini API Key를 모두 입력해야 합니다.</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            다시 업로드
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!mappingComplete || usableInquiries.length === 0 || !hasBothKeys}
            onClick={() => onStartAnalysis(false)}
          >
            Jev 분석만 실행
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!mappingComplete || usableInquiries.length === 0 || !hasBothKeys}
            onClick={() => onStartAnalysis(true)}
          >
            Jev 분석 + Gemini 답변 생성
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfSplitControls({
  workflow,
  onSetMode,
}: {
  workflow: ReturnType<typeof import("./useFileWorkflow").useFileWorkflow>;
  onSetMode: (mode: PdfSplitMode, customDelimiter?: string) => void;
}) {
  const { state, pdfSplitCandidateCounts } = workflow;
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>
        PDF 문의 분리 방식 ({state.pdfPageCount}페이지)
      </h3>
      <div className="pill-select" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={state.pdfSplitMode === "blank-line" ? "is-active" : ""}
          onClick={() => onSetMode("blank-line")}
        >
          빈 줄 기준 ({pdfSplitCandidateCounts?.blankLine ?? 0}건)
        </button>
        <button
          type="button"
          className={state.pdfSplitMode === "numbering" ? "is-active" : ""}
          onClick={() => onSetMode("numbering")}
        >
          번호 매김 기준 ({pdfSplitCandidateCounts?.numbering ?? 0}건)
        </button>
        <button
          type="button"
          className={state.pdfSplitMode === "custom" ? "is-active" : ""}
          onClick={() => onSetMode("custom", state.pdfCustomDelimiter)}
        >
          사용자 지정 구분자
        </button>
      </div>
      {state.pdfSplitMode === "custom" && (
        <div className="form-row" style={{ maxWidth: 320 }}>
          <label htmlFor="pdf-delim">구분자 (예: ---)</label>
          <input
            id="pdf-delim"
            type="text"
            value={state.pdfCustomDelimiter}
            onChange={(e) => onSetMode("custom", e.target.value)}
          />
        </div>
      )}
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
          추출된 전체 텍스트 미리보기
        </summary>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 12.5,
            background: "var(--bg-card-alt)",
            padding: 12,
            borderRadius: 8,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {state.pdfFullText}
        </pre>
      </details>
    </div>
  );
}
