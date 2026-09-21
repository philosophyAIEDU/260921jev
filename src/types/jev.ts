// Jev API 요청/응답 및 정규화된 결과 타입

export type JevQuestionType = "noul" | "choice" | "score";

export interface JevNoulQuestion {
  type: "noul";
  instructions: string;
  criteria?: Record<string, string>;
}

export interface JevChoiceQuestion {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
}

export interface JevScoreQuestion {
  type: "score";
  instructions: string;
  criteria: string[];
}

export type JevQuestion = JevNoulQuestion | JevChoiceQuestion | JevScoreQuestion;

export interface JevQuestionSet {
  category: JevChoiceQuestion;
  sentiment: JevChoiceQuestion;
  is_urgent: JevNoulQuestion;
  needs_human_review: JevNoulQuestion;
  needs_reply: JevNoulQuestion;
  severity: JevScoreQuestion;
}

export interface JevRequestBody {
  model: string;
  state: Record<string, unknown>;
  questions: JevQuestionSet;
}

// --- Jev 원본 응답 (API가 실제로 돌려주는 형태) ---

export interface JevNoulAnswerRaw {
  noul: number;
}

export interface JevChoiceAnswerRaw {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevScoreAnswerRaw {
  score: number;
  confidence: number;
  probabilities: number[];
}

export interface JevAnswersRaw {
  category: JevChoiceAnswerRaw;
  sentiment: JevChoiceAnswerRaw;
  is_urgent: JevNoulAnswerRaw;
  needs_human_review: JevNoulAnswerRaw;
  needs_reply: JevNoulAnswerRaw;
  severity: JevScoreAnswerRaw;
}

export interface JevResponseRaw {
  answers: JevAnswersRaw;
  [key: string]: unknown;
}

// --- 앱에서 사용하는 정규화된 결과 ---

export const INQUIRY_CATEGORIES = [
  "delivery",
  "payment",
  "refund_exchange",
  "product",
  "account",
  "complaint",
  "compliment",
  "spam",
  "other",
] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export const SENTIMENTS = [
  "positive",
  "neutral",
  "frustrated",
  "angry",
  "unclear",
] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export interface NormalizedChoice<T extends string = string> {
  choice: T;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface NormalizedScore {
  score: number;
  confidence: number;
  probabilities: number[];
  maxStage: number;
}

export interface NormalizedJevResult {
  category: NormalizedChoice<InquiryCategory>;
  sentiment: NormalizedChoice<Sentiment>;
  is_urgent: number;
  needs_human_review: number;
  needs_reply: number;
  severity: NormalizedScore;
}

export interface JevErrorInfo {
  kind:
    | "invalid_key"
    | "quota_exceeded"
    | "rate_limited"
    | "network"
    | "malformed_response"
    | "unknown";
  message: string;
}
