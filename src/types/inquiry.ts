// 고객 문의 레코드와 파일 파싱 관련 타입

export interface RawInquiryRow {
  inquiry_id?: string;
  received_at?: string;
  channel?: string;
  customer_name?: string;
  customer_email?: string;
  order_id?: string;
  inquiry_text: string;
  language?: string;
}

export interface ParsedInquiry extends RawInquiryRow {
  /** 파싱 시 자동 생성된 내부 고유 ID (행 순서 기반) */
  rowKey: string;
  isDuplicate: boolean;
  isEmpty: boolean;
  error?: string;
}

export interface ColumnMapping {
  inquiry_id: string | null;
  received_at: string | null;
  channel: string | null;
  customer_name: string | null;
  customer_email: string | null;
  order_id: string | null;
  inquiry_text: string | null;
  language: string | null;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  sheetNames?: string[];
  selectedSheet?: string;
  suggestedMapping: ColumnMapping;
}

export const FILE_LIMITS = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxInquiries: 200,
  maxInquiryLength: 5000,
};

export const COLUMN_NAME_CANDIDATES: Record<keyof ColumnMapping, string[]> = {
  inquiry_id: ["inquiry_id", "문의id", "문의번호", "id"],
  received_at: ["received_at", "접수일시", "날짜", "접수일"],
  channel: ["channel", "채널"],
  customer_name: ["customer_name", "고객명", "이름"],
  customer_email: ["customer_email", "이메일", "고객이메일", "email", "e-mail"],
  order_id: ["order_id", "주문번호"],
  inquiry_text: [
    "inquiry_text",
    "고객문의",
    "문의내용",
    "내용",
    "message",
    "문의",
  ],
  language: ["language", "언어"],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | undefined): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}
