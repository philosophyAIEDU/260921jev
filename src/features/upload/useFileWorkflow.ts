import { useCallback, useMemo, useState } from "react";
import type * as XLSXType from "xlsx";
import { detectFileKind, validateFileSize, FileValidationError, type SupportedFileKind } from "../../lib/fileParsers/fileValidation";
import { parseCsvFile, CsvParseError } from "../../lib/fileParsers/csvParser";
import { parseExcelSheet, readExcelWorkbook, ExcelParseError } from "../../lib/fileParsers/excelParser";
import {
  extractPdfText,
  splitPdfText,
  pdfSegmentsToRows,
  computeSplitCandidates,
  PdfParseError,
  PdfNoTextError,
  type PdfSplitMode,
} from "../../lib/fileParsers/pdfParser";
import { suggestColumnMapping } from "../../lib/fileParsers/columnMapping";
import { rowsToInquiries, filterUsableInquiries } from "../../lib/fileParsers/rowsToInquiries";
import type { ColumnMapping, ParseResult } from "../../types/inquiry";

export interface FileWorkflowState {
  fileKind: SupportedFileKind | null;
  fileName: string | null;
  loading: boolean;
  error: string | null;

  excelWorkbook: XLSXType.WorkBook | null;
  sheetNames: string[];
  selectedSheet: string | null;

  pdfFullText: string | null;
  pdfPageCount: number;
  pdfSplitMode: PdfSplitMode;
  pdfCustomDelimiter: string;

  parseResult: ParseResult | null;
  mapping: ColumnMapping | null;
}

const EMPTY_MAPPING: ColumnMapping = {
  inquiry_id: null,
  received_at: null,
  channel: null,
  customer_name: null,
  order_id: null,
  inquiry_text: null,
  language: null,
};

export function useFileWorkflow() {
  const [state, setState] = useState<FileWorkflowState>({
    fileKind: null,
    fileName: null,
    loading: false,
    error: null,
    excelWorkbook: null,
    sheetNames: [],
    selectedSheet: null,
    pdfFullText: null,
    pdfPageCount: 0,
    pdfSplitMode: "blank-line",
    pdfCustomDelimiter: "\n",
    parseResult: null,
    mapping: null,
  });

  const loadFile = useCallback(async (file: File): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null, fileName: file.name }));
    try {
      validateFileSize(file);
      const kind = detectFileKind(file);

      if (kind === "csv") {
        const result = await parseCsvFile(file);
        setState((s) => ({
          ...s,
          fileKind: kind,
          loading: false,
          parseResult: result,
          mapping: result.suggestedMapping,
          excelWorkbook: null,
          sheetNames: [],
          selectedSheet: null,
        }));
        return true;
      }

      if (kind === "excel") {
        const workbook = await readExcelWorkbook(file);
        const firstSheet = workbook.SheetNames[0];
        const result = parseExcelSheet(workbook, firstSheet);
        setState((s) => ({
          ...s,
          fileKind: kind,
          loading: false,
          excelWorkbook: workbook,
          sheetNames: workbook.SheetNames,
          selectedSheet: firstSheet,
          parseResult: result,
          mapping: result.suggestedMapping,
        }));
        return true;
      }

      // PDF
      const extracted = await extractPdfText(file);
      const segments = splitPdfText(extracted.fullText, "blank-line");
      const rows = pdfSegmentsToRows(segments);
      const result: ParseResult = {
        headers: ["inquiry_text"],
        rows,
        suggestedMapping: { ...EMPTY_MAPPING, inquiry_text: "inquiry_text" },
      };
      setState((s) => ({
        ...s,
        fileKind: kind,
        loading: false,
        pdfFullText: extracted.fullText,
        pdfPageCount: extracted.pageCount,
        pdfSplitMode: "blank-line",
        parseResult: result,
        mapping: result.suggestedMapping,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof FileValidationError ||
        err instanceof CsvParseError ||
        err instanceof ExcelParseError ||
        err instanceof PdfNoTextError ||
        err instanceof PdfParseError
          ? err.message
          : "파일을 처리하는 중 알 수 없는 오류가 발생했습니다.";
      setState((s) => ({ ...s, loading: false, error: message }));
      return false;
    }
  }, []);

  const selectSheet = useCallback((sheetName: string) => {
    setState((s) => {
      if (!s.excelWorkbook) return s;
      try {
        const result = parseExcelSheet(s.excelWorkbook, sheetName);
        return { ...s, selectedSheet: sheetName, parseResult: result, mapping: result.suggestedMapping };
      } catch (err) {
        return { ...s, error: err instanceof Error ? err.message : "시트를 불러오지 못했습니다." };
      }
    });
  }, []);

  const setMapping = useCallback((mapping: ColumnMapping) => {
    setState((s) => ({ ...s, mapping }));
  }, []);

  const setPdfSplitMode = useCallback((mode: PdfSplitMode, customDelimiter?: string) => {
    setState((s) => {
      if (!s.pdfFullText) return s;
      const segments = splitPdfText(s.pdfFullText, mode, customDelimiter ?? s.pdfCustomDelimiter);
      const rows = pdfSegmentsToRows(segments);
      const headers = ["inquiry_text"];
      return {
        ...s,
        pdfSplitMode: mode,
        pdfCustomDelimiter: customDelimiter ?? s.pdfCustomDelimiter,
        parseResult: { headers, rows, suggestedMapping: suggestColumnMapping(headers) },
        mapping: { ...EMPTY_MAPPING, inquiry_text: "inquiry_text" },
      };
    });
  }, []);

  const pdfSplitCandidateCounts = useMemo(() => {
    if (!state.pdfFullText) return null;
    const candidates = computeSplitCandidates(state.pdfFullText);
    return { blankLine: candidates.byBlankLine.length, numbering: candidates.byNumbering.length };
  }, [state.pdfFullText]);

  const reset = useCallback(() => {
    setState({
      fileKind: null,
      fileName: null,
      loading: false,
      error: null,
      excelWorkbook: null,
      sheetNames: [],
      selectedSheet: null,
      pdfFullText: null,
      pdfPageCount: 0,
      pdfSplitMode: "blank-line",
      pdfCustomDelimiter: "\n",
      parseResult: null,
      mapping: null,
    });
  }, []);

  const parsedInquiries = useMemo(() => {
    if (!state.parseResult || !state.mapping) return [];
    return rowsToInquiries(state.parseResult.rows, state.mapping);
  }, [state.parseResult, state.mapping]);

  const usableInquiries = useMemo(() => filterUsableInquiries(parsedInquiries), [parsedInquiries]);

  return {
    state,
    loadFile,
    selectSheet,
    setMapping,
    setPdfSplitMode,
    pdfSplitCandidateCounts,
    reset,
    parsedInquiries,
    usableInquiries,
  };
}
