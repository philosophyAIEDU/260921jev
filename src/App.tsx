import { useRef, useState } from "react";
import { ApiKeyProvider, useApiKeys } from "./lib/apiKeyContext";
import { Header, type AppMode } from "./components/Header";
import { SettingsPanel } from "./components/SettingsPanel";
import { UploadStep } from "./features/upload/UploadStep";
import { PreviewStep } from "./features/upload/PreviewStep";
import { useFileWorkflow } from "./features/upload/useFileWorkflow";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ConceptIntroCards } from "./features/learning/ConceptIntroCards";
import { QuestionDesignCards } from "./features/learning/QuestionDesignCards";
import { ProbConfidenceDemo } from "./features/learning/ProbConfidenceDemo";
import { PracticePage } from "./features/learning/PracticePage";
import { QuizSection } from "./features/learning/QuizSection";
import { DEFAULT_SETTINGS, type AppSettings } from "./types/settings";
import type { InquiryRecord } from "./types/pipeline";
import type { ParsedInquiry } from "./types/inquiry";
import { runPipeline } from "./lib/api/pipelineRunner";
import { callGeminiReply } from "./lib/api/geminiClient";
import { buildGeminiContext } from "./types/gemini";
import { AppApiError } from "./lib/api/apiErrors";

type Step = "upload" | "preview" | "workspace";
type LearningView = "main" | "practice" | "quiz";

function AppInner() {
  const { hasBothKeys, jevApiKey, geminiApiKey } = useApiKeys();
  const [mode, setMode] = useState<AppMode>("ops");
  const [learningView, setLearningView] = useState<LearningView>("main");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [step, setStep] = useState<Step>("upload");
  const [showLearningSuggestion, setShowLearningSuggestion] = useState(true);

  const workflow = useFileWorkflow();

  const [records, setRecords] = useState<InquiryRecord[]>([]);
  const [pendingInquiries, setPendingInquiries] = useState<ParsedInquiry[]>([]);
  const [running, setRunning] = useState(false);
  const [generateReplies, setGenerateReplies] = useState(true);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const abortedRef = useRef(false);

  function updateRecord(rowKey: string, patch: Partial<InquiryRecord>) {
    setRecords((prev) =>
      prev.map((r) => (r.inquiry.rowKey === rowKey ? { ...r, ...patch } : r))
    );
  }

  async function runBatch(batch: InquiryRecord[], withReplies: boolean) {
    abortedRef.current = false;
    setRunning(true);
    await runPipeline(batch, {
      jevApiKey,
      geminiApiKey,
      settings,
      generateReplies: withReplies,
      concurrency: 3,
      isAborted: () => abortedRef.current,
      onUpdate: updateRecord,
    });
    setRunning(false);
  }

  // limit: API 비용을 아끼기 위해 사용자가 이번에 처리할 건수를 직접 고른다.
  // 전체 usableInquiries 중 limit만큼만 즉시 분석하고 나머지는 pendingInquiries에 보관해
  // "다음 N건 이어서 분석"으로 나중에 이어갈 수 있게 한다.
  async function startAnalysis(withReplies: boolean, limit: number) {
    const all = workflow.usableInquiries;
    const firstBatch = all.slice(0, limit);
    const rest = all.slice(limit);

    const initial: InquiryRecord[] = firstBatch.map((inquiry) => ({
      inquiry,
      status: "waiting",
      approval: "pending",
    }));
    setRecords(initial);
    setPendingInquiries(rest);
    setGenerateReplies(withReplies);
    setStep("workspace");
    await runBatch(initial, withReplies);
  }

  async function continueAnalysis(limit: number) {
    const nextBatch = pendingInquiries.slice(0, limit);
    if (nextBatch.length === 0) return;
    setPendingInquiries((prev) => prev.slice(limit));

    const newRecords: InquiryRecord[] = nextBatch.map((inquiry) => ({
      inquiry,
      status: "waiting",
      approval: "pending",
    }));
    setRecords((prev) => [...prev, ...newRecords]);
    await runBatch(newRecords, generateReplies);
  }

  function abort() {
    abortedRef.current = true;
  }

  async function retryFailed() {
    const failed = records.filter((r) => r.status === "failed");
    if (failed.length === 0) return;
    failed.forEach((r) => updateRecord(r.inquiry.rowKey, { status: "waiting", errorMessage: undefined }));
    await runBatch(
      failed.map((r) => ({ ...r, status: "waiting" as const })),
      generateReplies
    );
  }

  async function regenerateReply(rowKey: string) {
    const record = records.find((r) => r.inquiry.rowKey === rowKey);
    if (!record?.jevResult) return;
    setRegeneratingKey(rowKey);
    try {
      const context = buildGeminiContext(
        record.inquiry.inquiry_text,
        record.jevResult,
        settings.brandName,
        settings.replyTone
      );
      const res = await callGeminiReply(geminiApiKey, settings.geminiModel, context);
      updateRecord(rowKey, {
        geminiReply: res.result,
        geminiRequestSummary: res.requestSummary,
        editedReply: undefined,
        approval: "pending",
      });
    } catch (err) {
      const message = err instanceof AppApiError ? err.message : "답변 재생성에 실패했습니다.";
      updateRecord(rowKey, { errorMessage: message });
    } finally {
      setRegeneratingKey(null);
    }
  }

  function backToUpload() {
    setStep("upload");
    setRecords([]);
    setPendingInquiries([]);
    workflow.reset();
  }

  return (
    <div className="app-shell">
      <Header mode={mode} onModeChange={setMode} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="app-main">
        {mode === "learning" && <LearningNav view={learningView} onChange={setLearningView} />}
        {mode === "learning" && learningView === "main" && step === "upload" && <ConceptIntroCards />}

        {mode === "learning" && learningView === "practice" && <PracticePage settings={settings} />}
        {mode === "learning" && learningView === "quiz" && <QuizSection />}

        {(mode === "ops" || learningView === "main") && (
          <>
            {mode === "ops" && showLearningSuggestion && step === "upload" && (
              <div className="learning-banner">
                <div>
                  <strong>처음이신가요?</strong> Jev 학습 모드를 켜면 Noul/Choice/Score가 무엇을
                  의미하는지 화면에서 바로 배울 수 있습니다.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode("learning")}>
                    학습 모드 켜기
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowLearningSuggestion(false)}
                  >
                    나중에
                  </button>
                </div>
              </div>
            )}

            {step === "upload" && (
              <UploadStep
                onFileSelected={(f) => {
                  workflow.loadFile(f).then((ok) => {
                    if (ok) setStep("preview");
                  });
                }}
                errorMessage={workflow.state.error ?? undefined}
              />
            )}

            {step === "preview" && (
              <>
                {mode === "learning" && <QuestionDesignCards />}
                <PreviewStep
                  workflow={workflow}
                  parsedInquiries={workflow.parsedInquiries}
                  usableInquiries={workflow.usableInquiries}
                  onStartAnalysis={startAnalysis}
                  onBack={backToUpload}
                  hasBothKeys={hasBothKeys}
                />
              </>
            )}

            {step === "workspace" && (
              <>
                {mode === "learning" && <ProbConfidenceDemo />}
                <WorkspacePage
                  mode={mode}
                  records={records}
                  running={running}
                  pendingCount={pendingInquiries.length}
                  onContinueAnalysis={continueAnalysis}
                  onAbort={abort}
                  onRetryFailed={retryFailed}
                  onBackToUpload={backToUpload}
                  onRegenerateReply={regenerateReply}
                  regeneratingKey={regeneratingKey}
                  onEditReply={(rowKey, text) => updateRecord(rowKey, { editedReply: text })}
                  onEditMemo={(rowKey, text) => updateRecord(rowKey, { internalMemo: text })}
                  onSetApproval={(rowKey, approval) => updateRecord(rowKey, { approval })}
                />
              </>
            )}
          </>
        )}
      </main>

      {settingsOpen && (
        <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

function LearningNav({
  view,
  onChange,
}: {
  view: LearningView;
  onChange: (v: LearningView) => void;
}) {
  return (
    <div className="tabs" style={{ marginBottom: 4 }}>
      <button className={view === "main" ? "is-active" : ""} onClick={() => onChange("main")}>
        파일 분석 실습
      </button>
      <button className={view === "practice" ? "is-active" : ""} onClick={() => onChange("practice")}>
        한 건 직접 실습
      </button>
      <button className={view === "quiz" ? "is-active" : ""} onClick={() => onChange("quiz")}>
        학습 확인 퀴즈
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ApiKeyProvider>
      <AppInner />
    </ApiKeyProvider>
  );
}
