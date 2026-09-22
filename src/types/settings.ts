// 앱 설정 (API Key/OAuth 토큰은 별도 in-memory 컨텍스트에서 관리, 여기에는 포함하지 않음)

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
  /** 접수 후 이 시간(시간 단위)이 지나도 미처리면 SLA 경과로 강조 표시 */
  slaWarningHours: number;
  /** Gmail 연동에 사용할 Google OAuth 클라이언트 ID (비밀값 아님, 공개 가능한 값) */
  gmailClientId: string;
  /**
   * 사람 검토가 필요 없다고 판정된 문의에 한해 답변 승인 시 Gmail로 자동 발송.
   * needs_human_review로 분류된 문의(결제/환불/안전 등)는 이 설정과 무관하게 항상 수동 발송만 허용한다.
   */
  autoSendEmail: boolean;
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
  slaWarningHours: 24,
  gmailClientId: "",
  autoSendEmail: false,
};
