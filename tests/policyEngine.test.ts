import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../src/lib/api/policyEngine";
import { DEFAULT_THRESHOLDS } from "../src/types/settings";
import type { NormalizedJevResult } from "../src/types/jev";

function buildResult(overrides: Partial<NormalizedJevResult> = {}): NormalizedJevResult {
  return {
    category: { choice: "product", confidence: 0.9, probabilities: { product: 0.9, other: 0.1 } },
    sentiment: { choice: "neutral", confidence: 0.9, probabilities: { neutral: 0.9, angry: 0.1 } },
    is_urgent: 0.1,
    needs_human_review: 0.1,
    needs_reply: 1,
    severity: { score: 1, confidence: 0.9, probabilities: [0.1, 0.6, 0.2, 0.1], maxStage: 3 },
    ...overrides,
  };
}

const policyOptions = { autoReplySpam: false, autoReplyCompliment: true };

describe("evaluatePolicy - 긴급 임계값", () => {
  it("is_urgent가 임계값 이상이면 긴급으로 표시한다", () => {
    const result = buildResult({ is_urgent: 0.85 });
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "문의 내용", policyOptions);
    expect(policy.isUrgent).toBe(true);
    expect(policy.needsHumanReview).toBe(true);
  });

  it("is_urgent가 임계값 미만이면 긴급이 아니다", () => {
    const result = buildResult({ is_urgent: 0.5 });
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "문의 내용", policyOptions);
    expect(policy.isUrgent).toBe(false);
  });
});

describe("evaluatePolicy - 낮은 confidence일 때 사람 검토 전환", () => {
  it("category confidence가 낮으면 사람 검토가 필요하다", () => {
    const result = buildResult({
      category: { choice: "product", confidence: 0.4, probabilities: { product: 0.4, other: 0.6 } },
    });
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "문의 내용", policyOptions);
    expect(policy.needsHumanReview).toBe(true);
    expect(policy.isLowConfidence).toBe(true);
  });

  it("confidence가 충분히 높고 다른 조건이 없으면 사람 검토가 필요하지 않다", () => {
    const result = buildResult();
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "일반적인 문의입니다", policyOptions);
    expect(policy.needsHumanReview).toBe(false);
  });

  it("결제/환불 유형은 항상 사람 검토가 필요하다", () => {
    const result = buildResult({
      category: { choice: "refund_exchange", confidence: 0.95, probabilities: { refund_exchange: 0.95 } },
    });
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "환불해주세요", policyOptions);
    expect(policy.needsHumanReview).toBe(true);
    expect(policy.isSensitiveCategory).toBe(true);
  });

  it("스팸은 기본 설정에서 자동 답변을 건너뛴다", () => {
    const result = buildResult({
      category: { choice: "spam", confidence: 0.95, probabilities: { spam: 0.95 } },
    });
    const policy = evaluatePolicy(result, DEFAULT_THRESHOLDS, "광고입니다", policyOptions);
    expect(policy.shouldSkipReply).toBe(true);
  });
});
