import { describe, expect, it } from "vitest";
import { normalizeJevResponse, JevResponseFormatError } from "../src/lib/api/jevNormalize";
import type { JevResponseRaw } from "../src/types/jev";

function buildRawResponse(overrides: Partial<JevResponseRaw["answers"]> = {}): JevResponseRaw {
  return {
    answers: {
      category: {
        choice: "delivery",
        confidence: 0.82,
        probabilities: { delivery: 0.82, other: 0.18 },
      },
      sentiment: {
        choice: "neutral",
        confidence: 0.7,
        probabilities: { neutral: 0.7, frustrated: 0.3 },
      },
      is_urgent: { noul: 0.15 },
      needs_human_review: { noul: 0.2 },
      needs_reply: { noul: 1 },
      severity: { score: 1.2, confidence: 0.65, probabilities: [0.1, 0.5, 0.3, 0.1] },
      ...overrides,
    },
  } as JevResponseRaw;
}

describe("normalizeJevResponse - Noul 정규화", () => {
  it("noul 값을 0~1 사이의 확률로 정규화한다", () => {
    const result = normalizeJevResponse(buildRawResponse());
    expect(result.is_urgent).toBe(0.15);
    expect(result.needs_human_review).toBe(0.2);
    expect(result.needs_reply).toBe(1);
  });

  it("noul 값이 범위를 벗어나면 오류를 던진다", () => {
    const raw = buildRawResponse({ is_urgent: { noul: 1.5 } });
    expect(() => normalizeJevResponse(raw)).toThrow(JevResponseFormatError);
  });
});

describe("normalizeJevResponse - Choice 정규화", () => {
  it("choice, confidence, probabilities를 그대로 구조화한다", () => {
    const result = normalizeJevResponse(buildRawResponse());
    expect(result.category.choice).toBe("delivery");
    expect(result.category.confidence).toBe(0.82);
    expect(result.category.probabilities.other).toBe(0.18);
  });

  it("허용되지 않은 choice 값이면 오류를 던진다", () => {
    const raw = buildRawResponse({
      category: { choice: "invalid_category", confidence: 0.5, probabilities: {} },
    });
    expect(() => normalizeJevResponse(raw)).toThrow(JevResponseFormatError);
  });
});

describe("normalizeJevResponse - Score 정규화", () => {
  it("score, confidence, probabilities, maxStage를 구조화한다", () => {
    const result = normalizeJevResponse(buildRawResponse());
    expect(result.severity.score).toBe(1.2);
    expect(result.severity.confidence).toBe(0.65);
    expect(result.severity.probabilities).toEqual([0.1, 0.5, 0.3, 0.1]);
    expect(result.severity.maxStage).toBe(3);
  });

  it("answers 필드가 없으면 오류를 던진다", () => {
    expect(() => normalizeJevResponse({} as JevResponseRaw)).toThrow(JevResponseFormatError);
  });
});
