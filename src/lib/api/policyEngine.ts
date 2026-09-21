import type { NormalizedJevResult } from "../../types/jev";
import type { PolicyThresholds } from "../../types/settings";

export interface PolicyDecision {
  isUrgent: boolean;
  needsHumanReview: boolean;
  needsHumanReviewReasons: string[];
  isHighSeverity: boolean;
  isLowConfidence: boolean;
  /** 금액/환불처럼 자동 확정이 금지된 민감 카테고리인지 여부 */
  isSensitiveCategory: boolean;
  /** 자동 답변 생성을 건너뛰어야 하는지 (스팸 등) */
  shouldSkipReply: boolean;
}

const SENSITIVE_CATEGORIES = new Set(["payment", "refund_exchange"]);

/** 민감정보/안전/법률/협박/자해 가능성을 문의 원문에서 대략적으로 감지한다 (보조 신호) */
const SAFETY_KEYWORDS = [
  "자해",
  "협박",
  "고소",
  "소송",
  "변호사",
  "개인정보",
  "주민등록번호",
  "화재",
  "연기",
  "폭발",
  "감전",
  "다쳤",
  "부상",
];

export function detectSafetyKeywords(inquiryText: string): boolean {
  return SAFETY_KEYWORDS.some((kw) => inquiryText.includes(kw));
}

export function evaluatePolicy(
  result: NormalizedJevResult,
  thresholds: PolicyThresholds,
  inquiryText: string,
  options: { autoReplySpam: boolean; autoReplyCompliment: boolean }
): PolicyDecision {
  const reasons: string[] = [];

  const isUrgent = result.is_urgent >= thresholds.urgentThreshold;
  if (isUrgent) reasons.push("긴급 기준 이상 (is_urgent)");

  const humanReviewByJev = result.needs_human_review >= thresholds.humanReviewThreshold;
  if (humanReviewByJev) reasons.push("사람 검토 기준 이상 (needs_human_review)");

  const lowCategoryConfidence = result.category.confidence < thresholds.lowConfidenceThreshold;
  if (lowCategoryConfidence) reasons.push("유형 판단 confidence가 낮음");

  const lowSentimentConfidence = result.sentiment.confidence < thresholds.lowConfidenceThreshold;
  if (lowSentimentConfidence) reasons.push("감정 판단 confidence가 낮음");

  const isHighSeverity = result.severity.score >= thresholds.highSeverityThreshold;
  if (isHighSeverity) reasons.push("심각도가 높음");

  const isSensitiveCategory = SENSITIVE_CATEGORIES.has(result.category.choice);
  if (isSensitiveCategory) reasons.push("결제/환불 등 금액 처리가 필요한 유형");

  const hasSafetyKeyword = detectSafetyKeywords(inquiryText);
  if (hasSafetyKeyword) reasons.push("개인정보/안전/법률 관련 표현 감지");

  const needsHumanReview =
    isUrgent ||
    humanReviewByJev ||
    lowCategoryConfidence ||
    lowSentimentConfidence ||
    isHighSeverity ||
    isSensitiveCategory ||
    hasSafetyKeyword;

  const isSpam = result.category.choice === "spam";
  const isCompliment = result.category.choice === "compliment";
  const shouldSkipReply =
    !result.needs_reply ||
    (isSpam && !options.autoReplySpam) ||
    (isCompliment && !options.autoReplyCompliment);

  return {
    isUrgent,
    needsHumanReview,
    needsHumanReviewReasons: reasons,
    isHighSeverity,
    isLowConfidence: lowCategoryConfidence || lowSentimentConfidence,
    isSensitiveCategory,
    shouldSkipReply,
  };
}
