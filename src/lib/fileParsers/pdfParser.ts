import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

export class PdfParseError extends Error {}
export class PdfNoTextError extends PdfParseError {}

export interface PdfExtractResult {
  pageCount: number;
  fullText: string;
  charCount: number;
}

const MIN_CHARS_PER_PAGE_FOR_TEXT = 20;

/** 추출된 문자 수가 스캔 이미지 PDF로 의심될 만큼 적은지 판단한다 (순수 함수, 테스트 용이) */
export function hasExtractableText(charCount: number, pageCount: number): boolean {
  return !(charCount < MIN_CHARS_PER_PAGE_FOR_TEXT * Math.max(pageCount, 1) * 0.2 && charCount < 30);
}

export async function extractPdfText(file: File | Blob): Promise<PdfExtractResult> {
  // 초기 번들 크기를 줄이기 위해 PDF 파일을 업로드할 때만 pdfjs-dist를 불러온다
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const buffer = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  } catch {
    throw new PdfParseError("PDF 파일을 읽을 수 없습니다. 파일이 손상되었을 수 있습니다.");
  }

  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(text.trim());
  }

  const fullText = pageTexts.join("\n\n");
  const charCount = fullText.replace(/\s/g, "").length;

  if (!hasExtractableText(charCount, doc.numPages)) {
    throw new PdfNoTextError(
      "이미지로 된 PDF는 현재 읽을 수 없습니다. CSV 또는 Excel로 변환해 주세요."
    );
  }

  return { pageCount: doc.numPages, fullText, charCount };
}

export type PdfSplitMode = "blank-line" | "numbering" | "custom";

const NUMBERING_PATTERN = /^\s*(?:\d+[.)]|문의\s*\d+[:.]?|[-*]\s)\s*/;

/** 빈 줄 기준으로 문의를 분리한다 */
export function splitByBlankLine(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 번호 매김 패턴(1. / 1) / 문의1:) 기준으로 문의를 분리한다 */
export function splitByNumbering(text: string): string[] {
  const lines = text.split(/\n/);
  const segments: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (NUMBERING_PATTERN.test(line)) {
      if (current.length > 0) segments.push(current.join(" ").trim());
      current = [line.replace(NUMBERING_PATTERN, "")];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) segments.push(current.join(" ").trim());

  return segments.filter((s) => s.length > 0);
}

export function splitByCustomDelimiter(text: string, delimiter: string): string[] {
  if (!delimiter) return [text.trim()].filter(Boolean);
  return text
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function splitPdfText(
  text: string,
  mode: PdfSplitMode,
  customDelimiter?: string
): string[] {
  switch (mode) {
    case "blank-line":
      return splitByBlankLine(text);
    case "numbering":
      return splitByNumbering(text);
    case "custom":
      return splitByCustomDelimiter(text, customDelimiter ?? "\n");
  }
}

export interface PdfSplitCandidates {
  byBlankLine: string[];
  byNumbering: string[];
}

/** 사용자가 분리 방식을 고를 수 있도록 두 방식의 결과를 모두 계산해 제공한다 */
export function computeSplitCandidates(text: string): PdfSplitCandidates {
  return {
    byBlankLine: splitByBlankLine(text),
    byNumbering: splitByNumbering(text),
  };
}

/** 분리된 문의 텍스트를 inquiry_text 단일 열을 가진 행 배열로 변환한다 */
export function pdfSegmentsToRows(segments: string[]): Record<string, string>[] {
  return segments.map((text) => ({ inquiry_text: text }));
}
