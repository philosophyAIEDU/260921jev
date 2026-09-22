import type { InquiryRecord } from "../../types/pipeline";

export function buildEmailSubject(brandName: string, record: InquiryRecord): string {
  const id = record.inquiry.inquiry_id ?? record.inquiry.rowKey;
  return `[${brandName}] 문의하신 내용에 대한 답변 (${id})`;
}

export function buildEmailBody(record: InquiryRecord): string {
  return (record.editedReply ?? record.geminiReply?.reply ?? "").trim();
}

/** 이메일 발송이 가능한 상태인지(자동/수동 공통 최소 조건) 확인한다 */
export function canSendEmail(record: InquiryRecord): boolean {
  return Boolean(record.geminiReply) && buildEmailBody(record).length > 0;
}
