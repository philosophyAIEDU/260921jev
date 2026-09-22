import { FILE_LIMITS, type ColumnMapping, type ParsedInquiry } from "../../types/inquiry";

/** 매핑된 원시 행 목록을 ParsedInquiry 배열로 변환한다. 빈 행 표시, 중복 표시, 길이 검증 포함. */
export function rowsToInquiries(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParsedInquiry[] {
  const seenText = new Map<string, number>();
  const result: ParsedInquiry[] = [];

  rows.forEach((row, index) => {
    const get = (key: keyof ColumnMapping): string | undefined => {
      const col = mapping[key];
      if (!col) return undefined;
      const value = row[col];
      return value === undefined || value === null ? undefined : String(value).trim();
    };

    const inquiryText = get("inquiry_text") ?? "";
    const isEmpty = inquiryText.length === 0;

    let error: string | undefined;
    let trimmedText = inquiryText;
    if (!isEmpty && inquiryText.length > FILE_LIMITS.maxInquiryLength) {
      trimmedText = inquiryText.slice(0, FILE_LIMITS.maxInquiryLength);
      error = `문의 내용이 ${FILE_LIMITS.maxInquiryLength}자를 초과하여 잘렸습니다.`;
    }

    const dupKey = trimmedText;
    let isDuplicate = false;
    if (!isEmpty) {
      const prevCount = seenText.get(dupKey) ?? 0;
      isDuplicate = prevCount > 0;
      seenText.set(dupKey, prevCount + 1);
    }

    result.push({
      rowKey: `row-${index}`,
      inquiry_id: get("inquiry_id"),
      received_at: get("received_at"),
      channel: get("channel"),
      customer_name: get("customer_name"),
      customer_email: get("customer_email"),
      order_id: get("order_id"),
      inquiry_text: trimmedText,
      language: get("language"),
      isDuplicate,
      isEmpty,
      error,
    });
  });

  return result;
}

export function filterUsableInquiries(inquiries: ParsedInquiry[]): ParsedInquiry[] {
  return inquiries.filter((r) => !r.isEmpty).slice(0, FILE_LIMITS.maxInquiries);
}
