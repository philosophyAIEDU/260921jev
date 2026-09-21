import {
  COLUMN_NAME_CANDIDATES,
  type ColumnMapping,
} from "../../types/inquiry";

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

/** 헤더 목록에서 알려진 열 이름을 자동으로 찾는다. 못 찾으면 null로 남긴다. */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  const findMatch = (candidates: string[]): string | null => {
    for (const candidate of candidates) {
      const normCandidate = normalizeHeader(candidate);
      const found = normalized.find((h) => h.norm === normCandidate);
      if (found) return found.raw;
    }
    return null;
  };

  const mapping = {} as ColumnMapping;
  for (const key of Object.keys(COLUMN_NAME_CANDIDATES) as (keyof ColumnMapping)[]) {
    mapping[key] = findMatch(COLUMN_NAME_CANDIDATES[key]);
  }
  return mapping;
}

export function isMappingComplete(mapping: ColumnMapping): boolean {
  return mapping.inquiry_text !== null;
}
