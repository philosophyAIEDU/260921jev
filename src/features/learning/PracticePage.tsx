import { useState } from "react";
import { useApiKeys } from "../../lib/apiKeyContext";
import type { AppSettings } from "../../types/settings";
import { INQUIRY_CATEGORIES, type InquiryCategory, type NormalizedJevResult } from "../../types/jev";
import type { GeminiReplyResult } from "../../types/gemini";
import { callJevAnalyze } from "../../lib/api/jevClient";
import { callGeminiReply } from "../../lib/api/geminiClient";
import { normalizeJevResponse } from "../../lib/api/jevNormalize";
import { buildGeminiContext } from "../../types/gemini";
import { AppApiError } from "../../lib/api/apiErrors";
import { SAMPLE_INQUIRIES } from "../../lib/sampleInquiries";
import { labelFor } from "../classification/resultViews";
import { NoulResultView, ChoiceResultView, ScoreResultView } from "../classification/resultViews";
import { explainChoice, explainNoul, explainScore } from "./explanations";
import { AlertTriangleIcon } from "../../components/icons";
import type { ParsedInquiry } from "../../types/inquiry";

type Stage = "input" | "predict" | "analyzing" | "result";

interface Prediction {
  category: InquiryCategory;
  urgent: "yes" | "no";
  severity: number;
}

export function PracticePage({ settings }: { settings: AppSettings }) {
  const { jevApiKey, geminiApiKey, hasBothKeys } = useApiKeys();
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [prediction, setPrediction] = useState<Prediction>({
    category: "other",
    urgent: "no",
    severity: 1,
  });
  const [jevResult, setJevResult] = useState<NormalizedJevResult | null>(null);
  const [geminiReply, setGeminiReply] = useState<GeminiReplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingReply, setGeneratingReply] = useState(false);

  function reset() {
    setStage("input");
    setText("");
    setJevResult(null);
    setGeminiReply(null);
    setError(null);
  }

  async function runAnalysis() {
    if (!hasBothKeys) {
      setError("설정에서 Jev, Gemini API Key를 먼저 입력해 주세요.");
      return;
    }
    setStage("analyzing");
    setError(null);
    try {
      const inquiry: ParsedInquiry = {
        rowKey: "practice",
        inquiry_text: text,
        isDuplicate: false,
        isEmpty: false,
      };
      const analyzed = await callJevAnalyze(jevApiKey, settings.jevModel, inquiry);
      const normalized = normalizeJevResponse(analyzed.response);
      setJevResult(normalized);
      setStage("result");
    } catch (err) {
      const message = err instanceof AppApiError ? err.message : "분석 중 오류가 발생했습니다.";
      setError(message);
      setStage("predict");
    }
  }

  async function generateReply() {
    if (!jevResult) return;
    setGeneratingReply(true);
    try {
      const context = buildGeminiContext(text, jevResult, settings.brandName, settings.replyTone);
      const res = await callGeminiReply(geminiApiKey, settings.geminiModel, context);
      setGeminiReply(res.result);
    } catch (err) {
      const message = err instanceof AppApiError ? err.message : "답변 생성 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setGeneratingReply(false);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">한 건 직접 실습</h2>
      <p className="card-subtitle">
        고객 문의 한 문장을 입력하고 State 확인 → Questions 확인 → Jev 분석 → 결과 해석 → Gemini
        답변 생성 순서로 직접 체험해 보세요.
      </p>

      {error && (
        <div className="notice-banner danger" style={{ marginBottom: 12 }}>
          <AlertTriangleIcon />
          <div>{error}</div>
        </div>
      )}

      {stage === "input" && (
        <div>
          <div className="form-row">
            <label>1. State 확인 — 고객 문의를 입력하세요</label>
            <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <p className="form-hint" style={{ marginBottom: 8 }}>
            예제 문의로 빠르게 시작할 수 있습니다. 왜 명확하거나 모호한 사례인지도 함께
            확인해 보세요.
          </p>
          <div className="grid grid-2" style={{ marginBottom: 14 }}>
            {SAMPLE_INQUIRIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="example-case-card"
                style={{ textAlign: "left", cursor: "pointer" }}
                onClick={() => setText(s.text)}
              >
                <strong style={{ fontSize: 13 }}>{s.text}</strong>
                <span className="text-muted" style={{ fontSize: 12 }}>{s.note}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!text.trim()}
            onClick={() => setStage("predict")}
          >
            2. Questions 확인 및 예상 결과 입력하기
          </button>
        </div>
      )}

      {(stage === "predict" || stage === "analyzing") && (
        <div>
          <div className="notice-banner info" style={{ marginBottom: 14 }}>
            Jev는 이 문의에 대해 유형(Choice), 감정(Choice), 긴급 여부(Noul), 사람 검토 필요
            여부(Noul), 심각도(Score)를 함께 판단합니다. 분석 전에 먼저 직접 예측해 보세요.
          </div>
          <div className="card" style={{ background: "var(--bg-card-alt)", marginBottom: 14 }}>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5 }}>{text}</p>
          </div>
          <div className="grid grid-3" style={{ marginBottom: 14 }}>
            <div className="form-row">
              <label>3. 예상 문의 유형</label>
              <select
                value={prediction.category}
                onChange={(e) => setPrediction((p) => ({ ...p, category: e.target.value as InquiryCategory }))}
              >
                {INQUIRY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {labelFor(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>긴급하다고 생각하나요?</label>
              <select
                value={prediction.urgent}
                onChange={(e) => setPrediction((p) => ({ ...p, urgent: e.target.value as "yes" | "no" }))}
              >
                <option value="no">아니요</option>
                <option value="yes">예</option>
              </select>
            </div>
            <div className="form-row">
              <label>예상 심각도 (0~3)</label>
              <input
                type="number"
                min={0}
                max={3}
                step={0.5}
                value={prediction.severity}
                onChange={(e) => setPrediction((p) => ({ ...p, severity: Number(e.target.value) }))}
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary" disabled={stage === "analyzing"} onClick={runAnalysis}>
            {stage === "analyzing" ? "4. Jev로 분석 중..." : "4. Jev로 분석하기"}
          </button>
        </div>
      )}

      {stage === "result" && jevResult && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>5. 예측과 결과 비교</h3>
          <div className="two-col" style={{ marginBottom: 16 }}>
            <div className="card" style={{ background: "var(--bg-card-alt)" }}>
              <strong>내 예측</strong>
              <p style={{ fontSize: 13.5, marginTop: 6 }}>
                유형: {labelFor(prediction.category)}
                <br />
                긴급: {prediction.urgent === "yes" ? "예" : "아니요"}
                <br />
                심각도: {prediction.severity}
              </p>
            </div>
            <div className="card" style={{ background: "var(--bg-card-alt)" }}>
              <strong>Jev 결과</strong>
              <p style={{ fontSize: 13.5, marginTop: 6 }}>
                유형: {labelFor(jevResult.category.choice)} ({(jevResult.category.confidence * 100).toFixed(0)}%
                confidence)
                <br />
                긴급 확률: {(jevResult.is_urgent * 100).toFixed(0)}%
                <br />
                심각도: {jevResult.severity.score.toFixed(2)} / {jevResult.severity.maxStage}
              </p>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
            정답과 오답을 가리기보다, 왜 이런 판단 차이가 생겼는지 살펴보는 것이 이 실습의
            목적입니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 12 }}>
              <NoulResultView label="긴급성 (is_urgent)" value={jevResult.is_urgent} />
              <div className="explain-callout" style={{ marginTop: 8 }}>
                {explainNoul("긴급성(is_urgent)", jevResult.is_urgent)}
              </div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <ChoiceResultView label="문의 유형 (category)" result={jevResult.category} />
              <div className="explain-callout" style={{ marginTop: 8 }}>
                {explainChoice("문의 유형(category)", jevResult.category)}
              </div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <ScoreResultView label="심각도 (severity)" result={jevResult.severity} />
              <div className="explain-callout" style={{ marginTop: 8 }}>
                {explainScore("심각도(severity)", jevResult.severity)}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>6. Gemini 답변 생성</h3>
          {!geminiReply ? (
            <button type="button" className="btn btn-primary" onClick={generateReply} disabled={generatingReply}>
              {generatingReply ? "생성 중..." : "Gemini로 답변 초안 생성"}
            </button>
          ) : (
            <div className="card" style={{ background: "var(--bg-card-alt)" }}>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{geminiReply.reply}</p>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={reset}>
              새로운 문의로 다시 실습하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
