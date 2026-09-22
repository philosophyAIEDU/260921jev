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
  type?: "noul";
  noul: number;
}

export interface JevChoiceAnswerRaw {
  type?: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevScoreAnswerRaw {
  type?: "score";
  score: number;
  confidence: number;
  /** 실제 API는 단계 인덱스를 키로 갖는 객체({"0":0.1,"1":0.9})를 반환한다 */
  probabilities: Record<string, number> | number[];
  /** 단계 인덱스 → 사용자가 정의한 단계 설명 */
  legend?: Record<string, string>;
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
  /** 단계 순서대로 정렬된 확률 배열 */
  probabilities: number[];
  /** 단계 순서대로 정렬된 단계 설명 (API가 legend를 주지 않으면 빈 배열) */
  legend: string[];
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
