import { FILE_LIMITS } from "../../types/inquiry";

export type SupportedFileKind = "csv" | "excel" | "pdf";

export class FileValidationError extends Error {}

export function detectFileKind(file: File): SupportedFileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (name.endsWith(".pdf")) return "pdf";
  throw new FileValidationError(
    "지원하지 않는 파일 형식입니다. CSV, Excel(xlsx/xls), PDF 파일만 업로드할 수 있습니다."
  );
}

export function validateFileSize(file: File): void {
  if (file.size > FILE_LIMITS.maxFileSizeBytes) {
    const maxMb = FILE_LIMITS.maxFileSizeBytes / (1024 * 1024);
    throw new FileValidationError(`파일 크기가 ${maxMb}MB를 초과했습니다.`);
  }
}
