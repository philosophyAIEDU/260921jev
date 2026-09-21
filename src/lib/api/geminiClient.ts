import type { GeminiReplyContext, GeminiReplyResult } from "../../types/gemini";
import { AppApiError } from "./apiErrors";

export interface GeminiReplyResponse {
  ok: true;
  requestSummary: Record<string, unknown>;
  result: GeminiReplyResult;
  retried: boolean;
}

export async function callGeminiReply(
  apiKey: string,
  model: string,
  context: GeminiReplyContext
): Promise<GeminiReplyResponse> {
  const res = await fetch("/api/gemini/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, model, context }),
  });

  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new AppApiError(json.errorKind ?? "unknown", json.message ?? "답변 생성에 실패했습니다.");
  }
  return json as GeminiReplyResponse;
}

export async function testConnection(
  provider: "jev" | "gemini",
  apiKey: string,
  model?: string
): Promise<void> {
  const res = await fetch("/api/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey, model }),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new AppApiError(json.errorKind ?? "unknown", json.message ?? "연결 테스트에 실패했습니다.");
  }
}
