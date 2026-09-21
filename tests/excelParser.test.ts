import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseExcelSheet } from "../src/lib/fileParsers/excelParser";

function buildWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const sheet1 = XLSX.utils.aoa_to_sheet([
    ["문의내용", "채널"],
    ["1월 배송 문의", "이메일"],
  ]);
  const sheet2 = XLSX.utils.aoa_to_sheet([
    ["문의내용", "채널"],
    ["2월 환불 문의", "채팅"],
    ["2월 결제 문의", "전화"],
  ]);
  XLSX.utils.book_append_sheet(wb, sheet1, "1월");
  XLSX.utils.book_append_sheet(wb, sheet2, "2월");
  return wb;
}

describe("parseExcelSheet - 여러 시트 중 선택", () => {
  it("워크북의 시트 이름 목록을 제공한다", () => {
    const wb = buildWorkbook();
    const result = parseExcelSheet(wb, "1월");
    expect(result.sheetNames).toEqual(["1월", "2월"]);
  });

  it("선택한 시트의 데이터만 파싱한다", () => {
    const wb = buildWorkbook();
    const jan = parseExcelSheet(wb, "1월");
    const feb = parseExcelSheet(wb, "2월");

    expect(jan.rows).toHaveLength(1);
    expect(jan.rows[0]["문의내용"]).toBe("1월 배송 문의");

    expect(feb.rows).toHaveLength(2);
    expect(feb.rows[1]["문의내용"]).toBe("2월 결제 문의");
  });

  it("필수 열을 자동 인식한다", () => {
    const wb = buildWorkbook();
    const result = parseExcelSheet(wb, "1월");
    expect(result.suggestedMapping.inquiry_text).toBe("문의내용");
    expect(result.suggestedMapping.channel).toBe("채널");
  });
});
