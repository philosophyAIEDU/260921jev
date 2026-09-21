import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/lib/fileParsers/csvParser";
import { rowsToInquiries } from "../src/lib/fileParsers/rowsToInquiries";

describe("parseCsvText - 한글 CSV 파싱", () => {
  it("한글 헤더와 값을 깨짐 없이 파싱한다", () => {
    const csv = [
      "문의ID,고객명,문의내용",
      'INQ-1,홍길동,"배송이 너무 늦어요"',
      'INQ-2,김철수,"환불하고 싶습니다"',
    ].join("\n");

    const result = parseCsvText(csv);

    expect(result.headers).toEqual(["문의ID", "고객명", "문의내용"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["고객명"]).toBe("홍길동");
    expect(result.rows[1]["문의내용"]).toBe("환불하고 싶습니다");
  });

  it("필수 열(문의내용)을 자동으로 인식한다", () => {
    const csv = ["문의ID,고객명,문의내용", 'INQ-1,홍길동,"배송 문의"'].join("\n");
    const result = parseCsvText(csv);
    expect(result.suggestedMapping.inquiry_text).toBe("문의내용");
  });

  it("영문 표준 헤더도 인식한다", () => {
    const csv = ["inquiry_id,inquiry_text", 'INQ-1,"hello"'].join("\n");
    const result = parseCsvText(csv);
    expect(result.suggestedMapping.inquiry_text).toBe("inquiry_text");
    expect(result.suggestedMapping.inquiry_id).toBe("inquiry_id");
  });

  it("열이 하나뿐인 CSV도 파싱에 실패하지 않는다", () => {
    const csv = ["inquiry_text", '"단일 열 문의입니다"', '"두 번째 문의"'].join("\n");
    const result = parseCsvText(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.suggestedMapping.inquiry_text).toBe("inquiry_text");
  });
});

describe("rowsToInquiries - 빈 행 처리", () => {
  it("빈 문의 내용을 가진 행을 isEmpty로 표시한다", () => {
    // 문의내용 열만 비어 있고 다른 열에 값이 있는 행 (완전 빈 행과는 다름)
    const csv = [
      "고객명,문의내용",
      '홍길동,"실제 문의"',
      "김철수,",
      '박영희,"   "',
    ].join("\n");
    const result = parseCsvText(csv);
    const inquiries = rowsToInquiries(result.rows, result.suggestedMapping);

    expect(inquiries).toHaveLength(3);
    expect(inquiries[0].isEmpty).toBe(false);
    expect(inquiries[1].isEmpty).toBe(true);
    expect(inquiries[2].isEmpty).toBe(true);
  });

  it("완전히 동일한 문의는 중복으로 표시하되 제거하지 않는다", () => {
    const csv = ["문의내용", '"동일한 문의"', '"동일한 문의"', '"다른 문의"'].join("\n");
    const result = parseCsvText(csv);
    const inquiries = rowsToInquiries(result.rows, result.suggestedMapping);

    expect(inquiries).toHaveLength(3);
    expect(inquiries[0].isDuplicate).toBe(false);
    expect(inquiries[1].isDuplicate).toBe(true);
    expect(inquiries[2].isDuplicate).toBe(false);
  });
});
