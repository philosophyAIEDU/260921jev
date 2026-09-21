import { describe, expect, it } from "vitest";
import {
  hasExtractableText,
  splitByBlankLine,
  splitByNumbering,
  splitByCustomDelimiter,
  pdfSegmentsToRows,
} from "../src/lib/fileParsers/pdfParser";

describe("hasExtractableText - PDF 텍스트 없음 판단", () => {
  it("스캔 이미지 PDF처럼 텍스트가 거의 없으면 false를 반환한다", () => {
    expect(hasExtractableText(0, 3)).toBe(false);
    expect(hasExtractableText(10, 5)).toBe(false);
  });

  it("텍스트가 충분히 추출되면 true를 반환한다", () => {
    expect(hasExtractableText(500, 2)).toBe(true);
    expect(hasExtractableText(120, 1)).toBe(true);
  });
});

describe("splitByBlankLine / splitByNumbering - PDF 문의 분리", () => {
  it("빈 줄 기준으로 문의를 분리한다", () => {
    const text = "첫 번째 문의입니다.\n\n두 번째 문의입니다.\n\n\n세 번째 문의입니다.";
    const segments = splitByBlankLine(text);
    expect(segments).toHaveLength(3);
    expect(segments[1]).toBe("두 번째 문의입니다.");
  });

  it("번호 매김 패턴 기준으로 문의를 분리한다", () => {
    const text = "1. 첫 번째 문의입니다.\n계속되는 내용입니다.\n2. 두 번째 문의입니다.";
    const segments = splitByNumbering(text);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toContain("첫 번째 문의입니다.");
    expect(segments[1]).toContain("두 번째 문의입니다.");
  });

  it("사용자 지정 구분자로 분리한다", () => {
    const segments = splitByCustomDelimiter("문의A---문의B---문의C", "---");
    expect(segments).toEqual(["문의A", "문의B", "문의C"]);
  });

  it("분리된 문의를 inquiry_text 단일 열 행으로 변환한다", () => {
    const rows = pdfSegmentsToRows(["문의A", "문의B"]);
    expect(rows).toEqual([{ inquiry_text: "문의A" }, { inquiry_text: "문의B" }]);
  });
});
