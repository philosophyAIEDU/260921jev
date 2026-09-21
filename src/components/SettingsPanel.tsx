import { useState } from "react";
import { useApiKeys } from "../lib/apiKeyContext";
import { testConnection } from "../lib/api/geminiClient";
import type { AppSettings, ReplyTone } from "../types/settings";
import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "./icons";

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onClose: () => void;
}

type TestState = "idle" | "testing" | "success" | "failed";

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const { jevApiKey, setJevApiKey, geminiApiKey, setGeminiApiKey } = useApiKeys();
  const [showJevKey, setShowJevKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [jevTest, setJevTest] = useState<{ state: TestState; message?: string }>({ state: "idle" });
  const [geminiTest, setGeminiTest] = useState<{ state: TestState; message?: string }>({ state: "idle" });

  function patch(partial: Partial<AppSettings>) {
    onChange({ ...settings, ...partial });
  }

  async function runTest(provider: "jev" | "gemini") {
    const key = provider === "jev" ? jevApiKey : geminiApiKey;
    const setState = provider === "jev" ? setJevTest : setGeminiTest;
    const model = provider === "jev" ? settings.jevModel : settings.geminiModel;

    if (!key.trim()) {
      setState({ state: "failed", message: "API Key를 먼저 입력해 주세요." });
      return;
    }
    setState({ state: "testing" });
    try {
      await testConnection(provider, key, model);
      setState({ state: "success", message: "연결에 성공했습니다." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "연결 테스트에 실패했습니다.";
      setState({ state: "failed", message });
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="설정">
      <div className="modal-panel" style={{ maxWidth: 640 }}>
        <div className="modal-panel__header">
          <h2 className="card-title" style={{ margin: 0 }}>
            설정
          </h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="notice-banner danger" style={{ marginBottom: 16 }}>
          <AlertTriangleIcon />
          <div>
            API Key는 이 탭의 메모리에서만 유지되며 저장소·로그에 남지 않습니다. 새로고침하면
            사라집니다. <strong>공용 컴퓨터에서는 키를 입력하지 마세요.</strong> 또한 실제
            고객의 개인정보가 포함된 데이터는 이 데모 앱에 입력하지 않는 것을 권장합니다.
          </div>
        </div>

        <section style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ fontSize: 14 }}>
            API Key
          </h3>

          <div className="form-row">
            <label htmlFor="jev-key">TypeSafe Jev API Key</label>
            <div className="key-input-row">
              <div>
                <input
                  id="jev-key"
                  type={showJevKey ? "text" : "password"}
                  autoComplete="off"
                  value={jevApiKey}
                  onChange={(e) => setJevApiKey(e.target.value)}
                  placeholder="sk-jev-..."
                />
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowJevKey((v) => !v)}>
                {showJevKey ? "숨기기" : "표시"}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => runTest("jev")}>
                연결 테스트
              </button>
            </div>
            <TestStatus test={jevTest} />
          </div>

          <div className="form-row">
            <label htmlFor="gemini-key">Google Gemini API Key</label>
            <div className="key-input-row">
              <div>
                <input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  autoComplete="off"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowGeminiKey((v) => !v)}
              >
                {showGeminiKey ? "숨기기" : "표시"}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => runTest("gemini")}>
                연결 테스트
              </button>
            </div>
            <TestStatus test={geminiTest} />
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ fontSize: 14 }}>
            모델 및 브랜드
          </h3>
          <div className="grid grid-2">
            <div className="form-row">
              <label htmlFor="jev-model">Jev 모델 ID</label>
              <input
                id="jev-model"
                type="text"
                value={settings.jevModel}
                onChange={(e) => patch({ jevModel: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label htmlFor="gemini-model">Gemini 모델 ID</label>
              <input
                id="gemini-model"
                type="text"
                value={settings.geminiModel}
                onChange={(e) => patch({ geminiModel: e.target.value })}
              />
              <div className="form-hint">
                모델이 계정에서 지원되지 않는다는 오류가 발생하면 사용 가능한 모델로 변경해
                주세요.
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="brand-name">브랜드명</label>
              <input
                id="brand-name"
                type="text"
                value={settings.brandName}
                onChange={(e) => patch({ brandName: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label htmlFor="reply-tone">답변 말투</label>
              <select
                id="reply-tone"
                value={settings.replyTone}
                onChange={(e) => patch({ replyTone: e.target.value as ReplyTone })}
              >
                <option value="friendly">친절함</option>
                <option value="polite">정중함</option>
                <option value="concise">간결함</option>
              </select>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ fontSize: 14 }}>
            임계값
          </h3>
          <div className="grid grid-2">
            <ThresholdInput
              label="긴급 기준 (is_urgent ≥)"
              value={settings.thresholds.urgentThreshold}
              onChange={(v) => patch({ thresholds: { ...settings.thresholds, urgentThreshold: v } })}
            />
            <ThresholdInput
              label="사람 검토 기준 (needs_human_review ≥)"
              value={settings.thresholds.humanReviewThreshold}
              onChange={(v) =>
                patch({ thresholds: { ...settings.thresholds, humanReviewThreshold: v } })
              }
            />
            <ThresholdInput
              label="낮은 confidence 기준 (<)"
              value={settings.thresholds.lowConfidenceThreshold}
              onChange={(v) =>
                patch({ thresholds: { ...settings.thresholds, lowConfidenceThreshold: v } })
              }
            />
            <ThresholdInput
              label="높은 심각도 기준 (severity ≥)"
              value={settings.thresholds.highSeverityThreshold}
              onChange={(v) =>
                patch({ thresholds: { ...settings.thresholds, highSeverityThreshold: v } })
              }
              max={3}
              step={0.1}
            />
          </div>
        </section>

        <section>
          <h3 className="card-title" style={{ fontSize: 14 }}>
            자동 답변 범위
          </h3>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={settings.autoReplySpam}
              onChange={(e) => patch({ autoReplySpam: e.target.checked })}
            />
            스팸으로 분류된 문의에도 자동 답변을 생성합니다 (기본: 생성 안 함)
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={settings.autoReplyCompliment}
              onChange={(e) => patch({ autoReplyCompliment: e.target.checked })}
            />
            긍정 후기(compliment)에 자동 답변을 생성합니다
          </label>
        </section>
      </div>
    </div>
  );
}

function ThresholdInput({
  label,
  value,
  onChange,
  max = 1,
  step = 0.05,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: number;
}) {
  return (
    <div className="form-row">
      <label>{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TestStatus({ test }: { test: { state: TestState; message?: string } }) {
  if (test.state === "idle") return null;
  if (test.state === "testing") return <div className="form-hint">연결 테스트 중...</div>;
  if (test.state === "success")
    return (
      <div className="form-hint" style={{ color: "var(--emerald-600)", display: "flex", gap: 4, alignItems: "center" }}>
        <CheckCircleIcon /> {test.message}
      </div>
    );
  return (
    <div className="form-hint" style={{ color: "var(--color-danger)", display: "flex", gap: 4, alignItems: "center" }}>
      <XCircleIcon /> {test.message}
    </div>
  );
}
