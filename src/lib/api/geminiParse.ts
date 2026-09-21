import type { GeminiReplyResult } from "../../types/gemini";

/** Gemini가 반환한 텍스트를 정해진 JSON 구조로 파싱한다. 실패 시 null을 반환한다. */
export function tryParseGeminiJson(text: string): GeminiReplyResult | null {
  const cleaned = extractJsonBlock(text);
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply,
      requires_human_review: Boolean(parsed.requires_human_review),
      internal_note: typeof parsed.internal_note === "string" ? parsed.internal_note : "",
      fallbackText: false,
    };
  } catch {
    return null;
  }
}

function extractJsonBlock(text: string): string | null {
  const trimmed = text.trim();
  // ```json ... ``` 코드펜스로 감싸진 경우 벗겨낸다
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return null;
  return candidate.slice(firstBrace, lastBrace + 1);
}

/** JSON 파싱이 끝내 실패했을 때 일반 텍스트를 안전하게 표시하기 위한 대체 결과 */
export function fallbackToPlainText(text: string): GeminiReplyResult {
  return {
    reply: text.trim(),
    requires_human_review: true,
    internal_note: "Gemini 응답의 JSON 파싱에 실패하여 원문 텍스트를 그대로 표시합니다.",
    fallbackText: true,
  };
}
