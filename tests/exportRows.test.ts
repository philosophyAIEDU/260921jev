import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { toExportRows } from "../src/lib/export/exportRows";
import type { InquiryRecord } from "../src/types/pipeline";

function buildRecord(): InquiryRecord {
  return {
    inquiry: {
      rowKey: "row-0",
      inquiry_id: "INQ-1",
      received_at: "2026-09-01",
      channel: "이메일",
      customer_name: "홍길동",
      order_id: "ORD-1",
      inquiry_text: "배송이 너무 늦어요. 환불도 고려하고 있습니다.",
      isDuplicate: false,
      isEmpty: false,
    },
    status: "done",
    approval: "approved",
    jevResult: {
      category: { choice: "delivery", confidence: 0.9, probabilities: { delivery: 0.9, other: 0.1 } },
      sentiment: { choice: "frustrated", confidence: 0.8, probabilities: { frustrated: 0.8, neutral: 0.2 } },
      is_urgent: 0.3,
      needs_human_review: 0.2,
      needs_reply: 1,
      severity: { score: 1.4, confidence: 0.75, probabilities: [0.1, 0.4, 0.4, 0.1], legend: [], maxStage: 3 },
    },
    geminiReply: {
      reply: "불편을 드려 죄송합니다. 주문번호를 확인해 조치하겠습니다.",
      requires_human_review: false,
      internal_note: "특이사항 없음",
      fallbackText: false,
    },
  };
}

describe("toExportRows / CSV 내보내기 - 한글 보존", () => {
  it("한글 고객명과 문의 내용을 그대로 보존한다", () => {
    const rows = toExportRows([buildRecord()]);
    expect(rows[0].customer_name).toBe("홍길동");
    expect(rows[0].inquiry_text).toBe("배송이 너무 늦어요. 환불도 고려하고 있습니다.");
    expect(rows[0].generated_reply).toContain("주문번호");
  });

  it("Papa.unparse로 CSV 문자열을 생성해도 한글이 깨지지 않는다", () => {
    const rows = toExportRows([buildRecord()]);
    const csv = Papa.unparse(rows);
    expect(csv).toContain("홍길동");
    expect(csv).toContain("배송이 너무 늦어요");
  });

  it("UTF-8 BOM을 CSV 문자열 앞에 붙인다", () => {
    const rows = toExportRows([buildRecord()]);
    const csv = "﻿" + Papa.unparse(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
