import type { ReplyTone } from "../../types/settings";
import type { GeminiReplyContext } from "../../types/gemini";

const TONE_LABEL: Record<ReplyTone, string> = {
  friendly: "친근하고 따뜻하게",
  polite: "정중하고 격식 있게",
  concise: "간결하고 명확하게",
};

export function buildGeminiSystemInstruction(brandName: string, tone: ReplyTone): string {
  return [
    "당신은 신중하고 친절한 고객 응대 담당자입니다.",
    `당신은 "${brandName}"를 대표하여 고객의 문의에 한국어로 간결한 답변 초안을 작성합니다.`,
    `말투는 ${TONE_LABEL[tone]} 작성하세요.`,
    "",
    "반드시 지킬 규칙:",
    "1. 고객이 겪은 불편에 먼저 공감하세요.",
    "2. 확인되지 않은 사실을 단정하지 마세요.",
    "3. 환불, 보상, 교환 또는 처리 완료를 임의로 약속하지 마세요.",
    "4. 카드번호, 비밀번호, 주민등록번호 등 민감정보를 요청하지 마세요.",
    "5. 필요한 경우 주문번호처럼 최소한의 비민감 정보만 요청하세요.",
    "6. 답변은 기본적으로 2~4문장으로 작성하세요.",
    "7. 금전, 안전, 개인정보, 법률 문제는 담당자 확인이 필요하다고 안내하세요.",
    "8. Jev 분석 결과를 고객에게 직접 언급하지 마세요.",
    "9. 고객의 감정에 맞추되 과도하게 사과하거나 책임을 확정하지 마세요.",
    "10. 광고성 스팸에는 답변을 작성하지 말고 빈 초안과 사유를 반환하세요.",
    "",
    "반드시 다음 JSON 형식으로만 답하세요:",
    '{"reply": "고객에게 보여 줄 답변 초안", "requires_human_review": true, "internal_note": "담당자에게만 보여 줄 짧은 주의사항"}',
  ].join("\n");
}

export function buildGeminiUserPrompt(ctx: GeminiReplyContext): string {
  const probLines = Object.entries(ctx.categoryProbabilities)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  - ${k}: ${(v * 100).toFixed(0)}%`)
    .join("\n");

  return [
    "[고객 문의 원문]",
    ctx.inquiryText,
    "",
    "[분류 정보 (내부 참고용, 고객에게 직접 언급 금지)]",
    `- 문의 유형: ${ctx.category}`,
    `- 유형별 확률:\n${probLines}`,
    `- 고객 감정: ${ctx.sentiment}`,
    `- 긴급 가능성: ${(ctx.urgentProbability * 100).toFixed(0)}%`,
    `- 사람 검토 필요 가능성: ${(ctx.humanReviewProbability * 100).toFixed(0)}%`,
    `- 문제 심각도(0~3): ${ctx.severityScore.toFixed(2)}`,
    "",
    "위 내용을 참고하여 시스템 지침에 따라 JSON으로 답변을 작성하세요.",
  ].join("\n");
}

export const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    requires_human_review: { type: "boolean" },
    internal_note: { type: "string" },
  },
  required: ["reply", "requires_human_review", "internal_note"],
};
