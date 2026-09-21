import type { JevRequestBody, JevResponseRaw } from "../../types/jev";
import type { ParsedInquiry } from "../../types/inquiry";
import { AppApiError } from "./apiErrors";

export interface JevAnalyzeResponse {
  ok: true;
  requestBody: JevRequestBody;
  response: JevResponseRaw;
}

export async function callJevAnalyze(
  apiKey: string,
  model: string,
  inquiry: ParsedInquiry
): Promise<JevAnalyzeResponse> {
  const res = await fetch("/api/jev/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      model,
      state: {
        inquiry_text: inquiry.inquiry_text,
        channel: inquiry.channel,
        customer_name: inquiry.customer_name,
        order_id: inquiry.order_id,
        received_at: inquiry.received_at,
        language: inquiry.language,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new AppApiError(json.errorKind ?? "unknown", json.message ?? "Jev 분석에 실패했습니다.");
  }
  return json as JevAnalyzeResponse;
}
