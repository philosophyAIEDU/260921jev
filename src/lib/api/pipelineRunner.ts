import type { InquiryRecord } from "../../types/pipeline";
import type { AppSettings } from "../../types/settings";
import { isValidEmail } from "../../types/inquiry";
import { normalizeJevResponse, JevResponseFormatError } from "./jevNormalize";
import { evaluatePolicy } from "./policyEngine";
import { callJevAnalyze } from "./jevClient";
import { callGeminiReply } from "./geminiClient";
import { sendGmailMessage } from "./gmailClient";
import { buildEmailSubject } from "./emailCompose";
import { buildGeminiContext } from "../../types/gemini";
import { AppApiError } from "./apiErrors";
import { runPool, withExponentialBackoff } from "./concurrency";
import { AnalysisCache } from "./analysisCache";

export interface AutoSendOptions {
  enabled: boolean;
  /** Gmail 연결이 되어 있지 않으면 null (그 경우 자동 발송은 조용히 건너뛴다) */
  accessToken: string | null;
}

export interface PipelineOptions {
  jevApiKey: string;
  geminiApiKey: string;
  settings: AppSettings;
  generateReplies: boolean;
  concurrency: number;
  isAborted: () => boolean;
  onUpdate: (rowKey: string, patch: Partial<InquiryRecord>) => void;
  /** 동일한 문의 내용을 재분석할 때 API를 재호출하지 않도록 하는 세션 캐시 (선택) */
  cache?: AnalysisCache;
  /**
   * 사람 검토가 필요 없다고 판정된 문의에 한해 답변 생성과 동시에 Gmail로 자동 발송한다.
   * needs_human_review로 판정된 문의는 이 옵션과 무관하게 절대 자동 발송하지 않는다.
   */
  autoSend?: AutoSendOptions;
}

const RETRYABLE_KINDS = new Set(["network", "rate_limited"]);

function isRetryableError(error: unknown): boolean {
  return error instanceof AppApiError && RETRYABLE_KINDS.has(error.kind);
}

export async function runPipeline(
  records: InquiryRecord[],
  options: PipelineOptions
): Promise<void> {
  const cache = options.cache ?? new AnalysisCache();
  await runPool(
    records,
    async (record) => processRecord(record, { ...options, cache }),
    { concurrency: options.concurrency, isAborted: options.isAborted }
  );
}

async function processRecord(record: InquiryRecord, options: PipelineOptions): Promise<void> {
  const { onUpdate, isAborted, cache } = options;
  const rowKey = record.inquiry.rowKey;
  const inquiryText = record.inquiry.inquiry_text;

  onUpdate(rowKey, { status: "analyzing", errorMessage: undefined });

  try {
    const jevLookup = await cache!.getOrFetchJev(inquiryText, async () => {
      const analyzeResult = await withExponentialBackoff(
        () => callJevAnalyze(options.jevApiKey, options.settings.jevModel, record.inquiry),
        { maxRetries: 2, baseDelayMs: 1000, isRetryable: isRetryableError, isAborted }
      );
      return {
        jevResult: normalizeJevResponse(analyzeResult.response),
        jevRequestJson: analyzeResult.requestBody,
        jevResponseJson: analyzeResult.response,
      };
    });
    const { jevResult: normalized, jevRequestJson, jevResponseJson } = jevLookup.value;

    const policy = evaluatePolicy(normalized, options.settings.thresholds, inquiryText, {
      autoReplySpam: options.settings.autoReplySpam,
      autoReplyCompliment: options.settings.autoReplyCompliment,
    });

    const afterAnalyze: Partial<InquiryRecord> = {
      jevResult: normalized,
      jevRequestJson,
      jevResponseJson,
      policy,
      status: policy.needsHumanReview ? "needs_review" : "done",
      fromCache: jevLookup.fromCache,
    };

    if (!options.generateReplies || policy.shouldSkipReply || isAborted()) {
      onUpdate(rowKey, afterAnalyze);
      return;
    }

    onUpdate(rowKey, { ...afterAnalyze, status: "generating_reply" });

    const { brandName, replyTone, geminiModel } = options.settings;
    const geminiLookup = await cache!.getOrFetchGemini(inquiryText, brandName, replyTone, geminiModel, async () => {
      const context = buildGeminiContext(inquiryText, normalized, brandName, replyTone);
      const result = await withExponentialBackoff(
        () => callGeminiReply(options.geminiApiKey, geminiModel, context),
        { maxRetries: 2, baseDelayMs: 1000, isRetryable: isRetryableError, isAborted }
      );
      return { geminiReply: result.result, geminiRequestSummary: result.requestSummary };
    });
    const replyResult = {
      result: geminiLookup.value.geminiReply,
      requestSummary: geminiLookup.value.geminiRequestSummary,
    };

    const finalStatus = policy.needsHumanReview ? "needs_review" : "done";
    onUpdate(rowKey, {
      geminiReply: replyResult.result,
      geminiRequestSummary: replyResult.requestSummary,
      status: finalStatus,
    });

    // 안전장치: needs_human_review 문의는 autoSend 설정과 무관하게 절대 자동 발송하지 않는다.
    const autoSend = options.autoSend;
    const canAutoSend =
      !policy.needsHumanReview &&
      autoSend?.enabled &&
      autoSend.accessToken &&
      isValidEmail(record.inquiry.customer_email) &&
      !isAborted();

    if (canAutoSend && autoSend?.accessToken) {
      onUpdate(rowKey, { emailSendStatus: "sending" });
      try {
        await sendGmailMessage({
          accessToken: autoSend.accessToken,
          to: record.inquiry.customer_email!,
          subject: buildEmailSubject(brandName, { ...record, geminiReply: replyResult.result }),
          body: replyResult.result.reply,
        });
        onUpdate(rowKey, {
          emailSendStatus: "sent",
          emailSentAt: new Date().toISOString(),
          approval: "approved",
        });
      } catch (err) {
        const message = err instanceof AppApiError ? err.message : "이메일 자동 발송에 실패했습니다.";
        onUpdate(rowKey, { emailSendStatus: "failed", emailError: message });
      }
    }
  } catch (error) {
    const message =
      error instanceof AppApiError
        ? error.message
        : error instanceof JevResponseFormatError
          ? error.message
          : "알 수 없는 오류로 처리에 실패했습니다.";
    onUpdate(rowKey, { status: "failed", errorMessage: message });
  }
}
