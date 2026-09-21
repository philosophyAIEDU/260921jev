// 앱 설정 (API Key는 별도 in-memory 컨텍스트에서 관리, 여기에는 포함하지 않음)

export type ReplyTone = "friendly" | "polite" | "concise";

export interface PolicyThresholds {
  urgentThreshold: number; // is_urgent >= 이 값이면 긴급
  humanReviewThreshold: number; // needs_human_review >= 이 값이면 사람 검토
  lowConfidenceThreshold: number; // choice confidence < 이 값이면 낮은 신뢰도
  highSeverityThreshold: number; // severity >= 이 값이면 높은 심각도
}

export const DEFAULT_THRESHOLDS: PolicyThresholds = {
  urgentThreshold: 0.8,
  humanReviewThreshold: 0.7,
  lowConfidenceThreshold: 0.5,
  highSeverityThreshold: 2.5,
};

export interface AppSettings {
  jevModel: string;
  geminiModel: string;
  brandName: string;
  replyTone: ReplyTone;
  thresholds: PolicyThresholds;
  autoReplySpam: boolean;
  autoReplyCompliment: boolean;
  learningModeEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  jevModel: "jev-latest",
  geminiModel: "gemini-3.5-flash-lite",
  brandName: "Jev Smart Desk",
  replyTone: "polite",
  thresholds: DEFAULT_THRESHOLDS,
  autoReplySpam: false,
  autoReplyCompliment: true,
  learningModeEnabled: false,
};
