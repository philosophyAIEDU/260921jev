import type { InquiryRecord } from "../../types/pipeline";
import type { AppSettings } from "../../types/settings";
import { normalizeJevResponse, JevResponseFormatError } from "./jevNormalize";
import { evaluatePolicy } from "./policyEngine";
import { callJevAnalyze } from "./jevClient";
import { callGeminiReply } from "./geminiClient";
import { buildGeminiContext } from "../../types/gemini";
import { AppApiError } from "./apiErrors";
import { runPool, withExponentialBackoff } from "./concurrency";

export interface PipelineOptions {
  jevApiKey: string;
  geminiApiKey: string;
  settings: AppSettings;
  generateReplies: boolean;
  concurrency: number;
  isAborted: () => boolean;
  onUpdate: (rowKey: string, patch: Partial<InquiryRecord>) => void;
}

const RETRYABLE_KINDS = new Set(["network", "rate_limited"]);

function isRetryableError(error: unknown): boolean {
  return error instanceof AppApiError && RETRYABLE_KINDS.has(error.kind);
}

export async function runPipeline(
  records: InquiryRecord[],
  options: PipelineOptions
): Promise<void> {
  await runPool(
    records,
    async (record) => processRecord(record, options),
    { concurrency: options.concurrency, isAborted: options.isAborted }
  );
}

async function processRecord(record: InquiryRecord, options: PipelineOptions): Promise<void> {
  const { onUpdate, isAborted } = options;
  const rowKey = record.inquiry.rowKey;

  onUpdate(rowKey, { status: "analyzing", errorMessage: undefined });

  try {
    const analyzeResult = await withExponentialBackoff(
      () => callJevAnalyze(options.jevApiKey, options.settings.jevModel, record.inquiry),
      { maxRetries: 2, baseDelayMs: 1000, isRetryable: isRetryableError, isAborted }
    );

    const normalized = normalizeJevResponse(analyzeResult.response);
    const policy = evaluatePolicy(normalized, options.settings.thresholds, record.inquiry.inquiry_text, {
      autoReplySpam: options.settings.autoReplySpam,
      autoReplyCompliment: options.settings.autoReplyCompliment,
    });

    const afterAnalyze: Partial<InquiryRecord> = {
      jevResult: normalized,
      jevRequestJson: analyzeResult.requestBody,
      jevResponseJson: analyzeResult.response,
      policy,
      status: policy.needsHumanReview ? "needs_review" : "done",
    };

    if (!options.generateReplies || policy.shouldSkipReply || isAborted()) {
      onUpdate(rowKey, afterAnalyze);
      return;
    }

    onUpdate(rowKey, { ...afterAnalyze, status: "generating_reply" });

    const context = buildGeminiContext(
      record.inquiry.inquiry_text,
      normalized,
      options.settings.brandName,
      options.settings.replyTone
    );

    const replyResult = await withExponentialBackoff(
      () => callGeminiReply(options.geminiApiKey, options.settings.geminiModel, context),
      { maxRetries: 2, baseDelayMs: 1000, isRetryable: isRetryableError, isAborted }
    );

    onUpdate(rowKey, {
      geminiReply: replyResult.result,
      geminiRequestSummary: replyResult.requestSummary,
      status: policy.needsHumanReview ? "needs_review" : "done",
    });
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
