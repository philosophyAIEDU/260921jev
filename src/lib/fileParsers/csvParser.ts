import Papa from "papaparse";
import type { ParseResult } from "../../types/inquiry";
import { suggestColumnMapping } from "./columnMapping";

export class CsvParseError extends Error {}

export async function parseCsvFile(file: File | Blob): Promise<ParseResult> {
  const text = await readFileAsText(file);
  return parseCsvText(text);
}

export function parseCsvText(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  // "Delimiter" 오류는 열이 하나뿐인 CSV에서도 발생하는 비치명적 경고이므로 무시하고,
  // 실제로 행을 하나도 읽지 못한 경우에만 오류로 처리한다.
  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new CsvParseError("CSV 파일에서 열 헤더를 찾을 수 없습니다.");
  }

  return {
    headers,
    rows: parsed.data,
    suggestedMapping: suggestColumnMapping(headers),
  };
}

function readFileAsText(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new CsvParseError("파일을 읽는 중 오류가 발생했습니다."));
    // BOM이 있는 UTF-8 한글 CSV를 올바르게 읽기 위해 UTF-8로 명시
    reader.readAsText(file, "UTF-8");
  });
}
