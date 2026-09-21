import type { InquiryRecord } from "../../types/pipeline";
import { AlertTriangleIcon, CheckCircleIcon } from "../../components/icons";

interface ReplyEditorProps {
  record: InquiryRecord;
  onEditReply: (text: string) => void;
  onEditMemo: (text: string) => void;
  onApprove: () => void;
  onHold: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

export function ReplyEditor({
  record,
  onEditReply,
  onEditMemo,
  onApprove,
  onHold,
  onRegenerate,
  regenerating,
}: ReplyEditorProps) {
  if (record.policy?.shouldSkipReply) {
    return (
      <div className="notice-banner">
        <AlertTriangleIcon />
        <div>이 문의는 정책상 자동 답변 생성 대상이 아닙니다 (스팸 또는 답변 불필요).</div>
      </div>
    );
  }

  if (!record.geminiReply) {
    return (
      <div>
        <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 10 }}>
          아직 Gemini 답변 초안이 생성되지 않았습니다.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? "생성 중..." : "답변 생성"}
        </button>
      </div>
    );
  }

  const replyText = record.editedReply ?? record.geminiReply.reply;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {record.geminiReply.requires_human_review && (
        <div className="notice-banner">
          <AlertTriangleIcon />
          <div>Gemini가 이 답변에 담당자 확인이 필요하다고 표시했습니다.</div>
        </div>
      )}
      {record.geminiReply.fallbackText && (
        <div className="notice-banner danger">
          <AlertTriangleIcon />
          <div>Gemini JSON 파싱에 실패하여 원문 텍스트를 그대로 표시합니다.</div>
        </div>
      )}

      <div className="form-row">
        <label>답변 초안 (수정 가능)</label>
        <textarea rows={5} value={replyText} onChange={(e) => onEditReply(e.target.value)} />
      </div>

      <div className="form-row">
        <label>내부 메모</label>
        <textarea
          rows={2}
          value={record.internalMemo ?? record.geminiReply.internal_note ?? ""}
          onChange={(e) => onEditMemo(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={onApprove}>
          <CheckCircleIcon /> 승인
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onHold}>
          보류
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? "재생성 중..." : "다시 생성"}
        </button>
      </div>

      {record.approval === "approved" && <span className="badge badge-success">승인됨</span>}
      {record.approval === "held" && <span className="badge badge-warning">보류됨</span>}
    </div>
  );
}
