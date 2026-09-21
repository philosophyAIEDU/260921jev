import { useState, type ReactNode } from "react";
import type { InquiryRecord } from "../../types/pipeline";
import type { AppMode } from "../../components/Header";
import { StatusBadge } from "../../components/StatusBadge";
import { JsonView } from "../../components/JsonView";
import { ChoiceResultView, NoulResultView, ScoreResultView } from "./resultViews";
import { ReplyEditor } from "../replies/ReplyEditor";
import { explainChoice, explainNoul, explainScore } from "../learning/explanations";

interface DetailPanelProps {
  record: InquiryRecord;
  mode: AppMode;
  onEditReply: (text: string) => void;
  onEditMemo: (text: string) => void;
  onApprove: () => void;
  onHold: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

type LearningTab = "simple" | "jev-request" | "jev-response" | "gemini-request" | "final-reply";

export function DetailPanel(props: DetailPanelProps) {
  const { record, mode } = props;
  const [tab, setTab] = useState<LearningTab>("simple");
  const [openExplain, setOpenExplain] = useState<Record<string, boolean>>({});

  function toggleExplain(key: string) {
    setOpenExplain((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <h2 className="card-title" style={{ marginBottom: 4 }}>
            문의 상세
          </h2>
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            {record.inquiry.inquiry_id ?? record.inquiry.rowKey} · {record.inquiry.channel ?? "채널 미상"}
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      {record.errorMessage && (
        <div className="notice-banner danger" style={{ marginBottom: 12 }}>
          {record.errorMessage}
        </div>
      )}

      {mode === "learning" && (
        <div className="tabs">
          {(
            [
              ["simple", "쉬운 설명"],
              ["jev-request", "Jev 요청 JSON"],
              ["jev-response", "Jev 응답 JSON"],
              ["gemini-request", "Gemini 요청 요약"],
              ["final-reply", "최종 고객 답변"],
            ] as [LearningTab, string][]
          ).map(([key, label]) => (
            <button key={key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === "ops" || tab === "simple" ? (
        <div className="state-questions-answers">
          <div className="sqa-col">
            <div className="sqa-col__title">고객 문의 원문 / State</div>
            <div className="card" style={{ background: "var(--bg-card-alt)", padding: 12 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {record.inquiry.inquiry_text}
              </p>
            </div>
            {record.jevRequestJson && (
              <div className="text-muted" style={{ fontSize: 12 }}>
                Jev에 전달된 항목: 문의 내용{record.inquiry.channel ? ", 채널" : ""}
                {record.inquiry.order_id ? ", 주문번호" : ""}
                {record.inquiry.received_at ? ", 접수일시" : ""}
              </div>
            )}
          </div>

          <div className="sqa-col">
            <div className="sqa-col__title">Jev 분석 결과 (Noul / Choice / Score)</div>
            {record.jevResult ? (
              <>
                <ResultWithExplain
                  id="urgent"
                  open={!!openExplain.urgent}
                  onToggle={() => toggleExplain("urgent")}
                  explain={explainNoul("긴급성(is_urgent)", record.jevResult.is_urgent)}
                >
                  <NoulResultView label="긴급성 (is_urgent)" value={record.jevResult.is_urgent} />
                </ResultWithExplain>
                <ResultWithExplain
                  id="review"
                  open={!!openExplain.review}
                  onToggle={() => toggleExplain("review")}
                  explain={explainNoul("사람 검토 필요(needs_human_review)", record.jevResult.needs_human_review)}
                >
                  <NoulResultView
                    label="사람 검토 필요 (needs_human_review)"
                    value={record.jevResult.needs_human_review}
                  />
                </ResultWithExplain>
                <ResultWithExplain
                  id="category"
                  open={!!openExplain.category}
                  onToggle={() => toggleExplain("category")}
                  explain={explainChoice("문의 유형(category)", record.jevResult.category)}
                >
                  <ChoiceResultView label="문의 유형 (category)" result={record.jevResult.category} />
                </ResultWithExplain>
                <ResultWithExplain
                  id="sentiment"
                  open={!!openExplain.sentiment}
                  onToggle={() => toggleExplain("sentiment")}
                  explain={explainChoice("감정(sentiment)", record.jevResult.sentiment)}
                >
                  <ChoiceResultView label="감정 (sentiment)" result={record.jevResult.sentiment} />
                </ResultWithExplain>
                <ResultWithExplain
                  id="severity"
                  open={!!openExplain.severity}
                  onToggle={() => toggleExplain("severity")}
                  explain={explainScore("심각도(severity)", record.jevResult.severity)}
                >
                  <ScoreResultView label="심각도 (severity)" result={record.jevResult.severity} />
                </ResultWithExplain>

                {record.policy && record.policy.needsHumanReviewReasons.length > 0 && (
                  <div className="notice-banner">
                    검토 필요 사유: {record.policy.needsHumanReviewReasons.join(", ")}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted" style={{ fontSize: 13 }}>
                아직 분석되지 않았습니다.
              </p>
            )}
          </div>

          <div className="sqa-col">
            <div className="sqa-col__title">Gemini 답변 초안</div>
            <ReplyEditor
              record={record}
              onEditReply={props.onEditReply}
              onEditMemo={props.onEditMemo}
              onApprove={props.onApprove}
              onHold={props.onHold}
              onRegenerate={props.onRegenerate}
              regenerating={props.regenerating}
            />
          </div>
        </div>
      ) : null}

      {mode === "learning" && tab === "jev-request" && (
        <div>
          <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
            state, model, questions 구조입니다. API Key는 포함되지 않습니다.
          </p>
          {record.jevRequestJson ? <JsonView data={record.jevRequestJson} /> : <EmptyState />}
        </div>
      )}
      {mode === "learning" && tab === "jev-response" && (
        <div>
          <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
            answers 아래의 noul, choice, score, probabilities, confidence를 확인할 수 있습니다.
          </p>
          {record.jevResponseJson ? <JsonView data={record.jevResponseJson} /> : <EmptyState />}
        </div>
      )}
      {mode === "learning" && tab === "gemini-request" && (
        <div>
          {record.geminiRequestSummary ? (
            <JsonView data={record.geminiRequestSummary} />
          ) : (
            <EmptyState />
          )}
        </div>
      )}
      {mode === "learning" && tab === "final-reply" && (
        <div>
          {record.geminiReply ? (
            <div className="card" style={{ background: "var(--bg-card-alt)" }}>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
                {record.editedReply ?? record.geminiReply.reply}
              </p>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <p className="text-muted" style={{ fontSize: 13 }}>아직 데이터가 없습니다.</p>;
}

function ResultWithExplain({
  id,
  open,
  onToggle,
  explain,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  explain: string;
  children: ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      {children}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ marginTop: 8 }}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`explain-${id}`}
      >
        이 결과는 무엇을 뜻하나요?
      </button>
      {open && (
        <div id={`explain-${id}`} className="explain-callout" style={{ marginTop: 8 }}>
          {explain}
        </div>
      )}
    </div>
  );
}
