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
}
