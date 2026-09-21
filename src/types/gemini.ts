// Gemini 답변 생성 요청/응답 타입

import type { ReplyTone } from "./settings";
import type { InquiryCategory, NormalizedJevResult, Sentiment } from "./jev";

export interface GeminiReplyContext {
  inquiryText: string;
  category: InquiryCategory;
  categoryProbabilities: Record<string, number>;
  sentiment: Sentiment;
  urgentProbability: number;
  humanReviewProbability: number;
  severityScore: number;
  brandName: string;
  tone: ReplyTone;
}

export interface GeminiReplyResult {
  reply: string;
  requires_human_review: boolean;
  internal_note: string;
  /** JSON 파싱에 실패해 일반 텍스트로 대체된 경우 true */
  fallbackText: boolean;
}

export function buildGeminiContext(
  inquiryText: string,
  jev: NormalizedJevResult,
  brandName: string,
  tone: ReplyTone
): GeminiReplyContext {
  return {
    inquiryText,
    category: jev.category.choice,
    categoryProbabilities: jev.category.probabilities,
    sentiment: jev.sentiment.choice,
    urgentProbability: jev.is_urgent,
    humanReviewProbability: jev.needs_human_review,
    severityScore: jev.severity.score,
    brandName,
    tone,
  };
}
