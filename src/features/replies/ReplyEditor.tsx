import type { InquiryRecord } from "../../types/pipeline";
import type { ReplyTemplate } from "../../types/template";
import { isValidEmail } from "../../types/inquiry";
import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "../../components/icons";

interface ReplyEditorProps {
  record: InquiryRecord;
  onEditReply: (text: string) => void;
  onEditMemo: (text: string) => void;
  onApprove: () => void;
  onHold: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  templates: ReplyTemplate[];
  gmailConnected: boolean;
  onSendEmail: () => void;
}

export function ReplyEditor({
  record,
  onEditReply,
  onEditMemo,
  onApprove,
  onHold,
  onRegenerate,
  regenerating,
  templates,
  gmailConnected,
  onSendEmail,
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
  const category = record.jevResult?.category.choice;
  const availableTemplates = templates.filter((t) => t.category === "all" || t.category === category);

  function insertTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const next = replyText.trim() ? `${replyText.trim()}\n${template.text}` : template.text;
    onEditReply(next);
  }

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

      {availableTemplates.length > 0 && (
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>빠른 답변 템플릿 삽입</label>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) insertTemplate(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">템플릿 선택...</option>
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
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

      {gmailConnected && <EmailSendSection record={record} onSendEmail={onSendEmail} />}
    </div>
  );
}

function EmailSendSection({ record, onSendEmail }: { record: InquiryRecord; onSendEmail: () => void }) {
  const hasEmail = isValidEmail(record.inquiry.customer_email);
  const sending = record.emailSendStatus === "sending";

  return (
    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginTop: 2 }}>
      {!hasEmail ? (
        <p className="text-muted" style={{ fontSize: 12.5 }}>
          고객 이메일 주소가 없어 발송할 수 없습니다. (열 매핑에서 "고객 이메일"을 지정하세요)
        </p>
      ) : (
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSendEmail} disabled={sending}>
            {sending ? "발송 중..." : `${record.inquiry.customer_email}로 이메일 발송`}
          </button>
          {record.emailSendStatus === "sent" && (
            <div
              className="form-hint"
              style={{ color: "var(--emerald-600)", display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}
            >
              <CheckCircleIcon />
              발송 완료{record.emailSentAt ? ` (${new Date(record.emailSentAt).toLocaleString("ko-KR")})` : ""}
            </div>
          )}
          {record.emailSendStatus === "failed" && record.emailError && (
            <div
              className="form-hint"
              style={{ color: "var(--color-danger)", display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}
            >
              <XCircleIcon /> {record.emailError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
