import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { InquiryRecord } from "../../types/pipeline";

export interface ExportRow {
  inquiry_id: string;
  received_at: string;
  channel: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  inquiry_text: string;
  category: string;
  category_confidence: string;
  sentiment: string;
  sentiment_confidence: string;
  urgent_probability: string;
  human_review_probability: string;
  needs_reply_probability: string;
  severity_score: string;
  severity_confidence: string;
  generated_reply: string;
  internal_note: string;
  status: string;
  assignee: string;
  email_sent_status: string;
  email_sent_at: string;
  error_message: string;
}

export function toExportRows(records: InquiryRecord[]): ExportRow[] {
  return records.map((r) => ({
    inquiry_id: r.inquiry.inquiry_id ?? "",
    received_at: r.inquiry.received_at ?? "",
    channel: r.inquiry.channel ?? "",
    customer_name: r.inquiry.customer_name ?? "",
    customer_email: r.inquiry.customer_email ?? "",
    order_id: r.inquiry.order_id ?? "",
    inquiry_text: r.inquiry.inquiry_text,
    category: r.jevResult?.category.choice ?? "",
    category_confidence: r.jevResult ? r.jevResult.category.confidence.toFixed(3) : "",
    sentiment: r.jevResult?.sentiment.choice ?? "",
    sentiment_confidence: r.jevResult ? r.jevResult.sentiment.confidence.toFixed(3) : "",
    urgent_probability: r.jevResult ? r.jevResult.is_urgent.toFixed(3) : "",
    human_review_probability: r.jevResult ? r.jevResult.needs_human_review.toFixed(3) : "",
    needs_reply_probability: r.jevResult ? r.jevResult.needs_reply.toFixed(3) : "",
    severity_score: r.jevResult ? r.jevResult.severity.score.toFixed(3) : "",
    severity_confidence: r.jevResult ? r.jevResult.severity.confidence.toFixed(3) : "",
    generated_reply: r.editedReply ?? r.geminiReply?.reply ?? "",
    internal_note: r.geminiReply?.internal_note ?? "",
    status: r.status,
    assignee: r.assignee ?? "",
    email_sent_status: r.emailSendStatus ?? "",
    email_sent_at: r.emailSentAt ?? "",
    error_message: r.errorMessage ?? "",
  }));
}

export function exportToCsv(records: InquiryRecord[]): void {
  const rows = toExportRows(records);
  const csv = Papa.unparse(rows);
  // 한글이 깨지지 않도록 UTF-8 BOM을 추가한다
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `jev-smart-desk-export-${timestamp()}.csv`);
}

export function exportToExcel(records: InquiryRecord[]): void {
  const rows = toExportRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "분석 결과");
  XLSX.writeFile(workbook, `jev-smart-desk-export-${timestamp()}.xlsx`);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
