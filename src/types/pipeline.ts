import type { GeminiReplyResult } from "./gemini";
import type { NormalizedJevResult, JevRequestBody, JevResponseRaw } from "./jev";
import type { ParsedInquiry } from "./inquiry";
import type { PolicyDecision } from "../lib/api/policyEngine";

export type RowStatus =
  | "waiting"
  | "analyzing"
  | "generating_reply"
  | "done"
  | "needs_review"
  | "failed";

export type ReplyApprovalStatus = "pending" | "approved" | "held" | "skipped";

export type EmailSendStatus = "idle" | "sending" | "sent" | "failed";

export interface InquiryRecord {
  inquiry: ParsedInquiry;
  status: RowStatus;
  jevResult?: NormalizedJevResult;
  jevRequestJson?: JevRequestBody;
  jevResponseJson?: JevResponseRaw;
  policy?: PolicyDecision;
  geminiReply?: GeminiReplyResult;
  geminiRequestSummary?: Record<string, unknown>;
  approval: ReplyApprovalStatus;
  editedReply?: string;
  internalMemo?: string;
  errorMessage?: string;
  /** 세션 캐시(동일 문의 재분석 방지)에서 가져온 결과인지 여부 */
  fromCache?: boolean;
  /** 담당자 배정 (자유 입력, 별도 로그인 시스템 없음) */
  assignee?: string;
  /** 이메일 자동/수동 발송 상태 */
  emailSendStatus?: EmailSendStatus;
  emailSentAt?: string;
  emailError?: string;
  /** 목록에서 일괄 처리를 위해 선택되었는지 여부 (UI 상태) */
  selected?: boolean;
}
