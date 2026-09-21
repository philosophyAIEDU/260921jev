import { describe, expect, it } from "vitest";
import { buildGeminiSystemInstruction, buildGeminiUserPrompt } from "../src/lib/api/geminiPrompt";
import { tryParseGeminiJson, fallbackToPlainText } from "../src/lib/api/geminiParse";
import type { GeminiReplyContext } from "../src/types/gemini";

describe("buildGeminiSystemInstruction - 민감정보 요청 금지 규칙", () => {
  it("카드번호, 비밀번호, 주민등록번호 요청 금지 규칙을 포함한다", () => {
    const instruction = buildGeminiSystemInstruction("Jev Smart Desk", "polite");
    expect(instruction).toContain("카드번호");
    expect(instruction).toContain("비밀번호");
    expect(instruction).toContain("주민등록번호");
  });

  it("환불/보상/교환 임의 약속 금지 규칙을 포함한다", () => {
    const instruction = buildGeminiSystemInstruction("Jev Smart Desk", "friendly");
    expect(instruction).toContain("환불");
    expect(instruction).toContain("임의로 약속하지");
  });

  it("Jev 분석 결과를 고객에게 직접 언급하지 말라는 규칙을 포함한다", () => {
    const instruction = buildGeminiSystemInstruction("Jev Smart Desk", "concise");
    expect(instruction).toContain("Jev 분석 결과를 고객에게 직접 언급하지");
  });
});

describe("buildGeminiUserPrompt", () => {
  it("고객 문의와 분류 정보를 프롬프트에 포함한다", () => {
    const ctx: GeminiReplyContext = {
      inquiryText: "배송이 늦어요",
      category: "delivery",
      categoryProbabilities: { delivery: 0.9, other: 0.1 },
      sentiment: "frustrated",
      urgentProbability: 0.2,
      humanReviewProbability: 0.1,
      severityScore: 1.5,
      brandName: "Jev Smart Desk",
      tone: "polite",
    };
    const prompt = buildGeminiUserPrompt(ctx);
    expect(prompt).toContain("배송이 늦어요");
    expect(prompt).toContain("delivery");
    expect(prompt).toContain("frustrated");
  });
});

describe("tryParseGeminiJson / fallbackToPlainText", () => {
  it("정상 JSON 텍스트를 파싱한다", () => {
    const text = '{"reply": "안녕하세요", "requires_human_review": false, "internal_note": "메모"}';
    const parsed = tryParseGeminiJson(text);
    expect(parsed?.reply).toBe("안녕하세요");
    expect(parsed?.requires_human_review).toBe(false);
  });

  it("코드펜스로 감싸진 JSON도 파싱한다", () => {
    const text = '```json\n{"reply": "안녕하세요", "requires_human_review": true, "internal_note": ""}\n```';
    const parsed = tryParseGeminiJson(text);
    expect(parsed?.reply).toBe("안녕하세요");
  });

  it("JSON이 아니면 null을 반환한다", () => {
    expect(tryParseGeminiJson("이것은 JSON이 아닙니다")).toBeNull();
  });

  it("파싱 실패 시 원문 텍스트를 안전하게 표시하는 대체 결과를 만든다", () => {
    const fallback = fallbackToPlainText("일반 텍스트 응답");
    expect(fallback.reply).toBe("일반 텍스트 응답");
    expect(fallback.fallbackText).toBe(true);
    expect(fallback.requires_human_review).toBe(true);
  });
});
