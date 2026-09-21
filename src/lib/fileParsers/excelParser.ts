import * as XLSX from "xlsx";
import type { ParseResult } from "../../types/inquiry";
import { suggestColumnMapping } from "./columnMapping";

export class ExcelParseError extends Error {}

export async function readExcelWorkbook(file: File | Blob): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  try {
    return XLSX.read(buffer, { type: "array" });
  } catch {
    throw new ExcelParseError("Excel 파일을 읽을 수 없습니다. 파일이 손상되었을 수 있습니다.");
  }
}

export function parseExcelSheet(workbook: XLSX.WorkBook, sheetName: string): ParseResult {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new ExcelParseError(`시트 "${sheetName}"를 찾을 수 없습니다.`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });

  const headers =
    rows.length > 0
      ? Object.keys(rows[0])
      : (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[] | undefined) ?? [];

  if (headers.length === 0) {
    throw new ExcelParseError("시트에서 열 헤더를 찾을 수 없습니다.");
  }

  return {
    headers,
    rows,
    sheetNames: workbook.SheetNames,
    selectedSheet: sheetName,
    suggestedMapping: suggestColumnMapping(headers),
  };
}

export async function parseExcelFile(
  file: File | Blob,
  sheetName?: string
): Promise<ParseResult> {
  const workbook = await readExcelWorkbook(file);
  const targetSheet = sheetName ?? workbook.SheetNames[0];
  if (!targetSheet) {
    throw new ExcelParseError("Excel 파일에 시트가 없습니다.");
  }
  return parseExcelSheet(workbook, targetSheet);
}
