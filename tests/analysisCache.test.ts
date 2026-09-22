import { describe, expect, it, vi } from "vitest";
import { AnalysisCache } from "../src/lib/api/analysisCache";
import type { NormalizedJevResult } from "../src/types/jev";
import type { GeminiReplyResult } from "../src/types/gemini";

function buildJevResult(): NormalizedJevResult {
  return {
    category: { choice: "delivery", confidence: 0.9, probabilities: { delivery: 0.9 } },
    sentiment: { choice: "neutral", confidence: 0.9, probabilities: { neutral: 0.9 } },
    is_urgent: 0.1,
    needs_human_review: 0.1,
    needs_reply: 1,
    severity: { score: 1, confidence: 0.9, probabilities: [0.1, 0.9], legend: [], maxStage: 1 },
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("AnalysisCache - Jev 결과 재사용", () => {
  it("완료된 결과가 있으면 fetcher를 다시 호출하지 않는다", async () => {
    const cache = new AnalysisCache();
    const fetcher = vi.fn(async () => ({
      jevResult: buildJevResult(),
      jevRequestJson: {} as never,
      jevResponseJson: {} as never,
    }));

    const first = await cache.getOrFetchJev("배송이 늦어요", fetcher);
    const second = await cache.getOrFetchJev("배송이 늦어요", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.value).toBe(first.value);
    expect(cache.getHitCount()).toBe(1);
  });

  it("동시에 들어온 동일 문의 요청은 진행 중인 요청 하나만 실제로 호출한다 (경쟁 상태 방지)", async () => {
    // 동시성 파이프라인에서 완전히 같은 문의를 가진 두 행이 거의 동시에 처리되는 상황을 재현한다.
    const cache = new AnalysisCache();
    const fetcher = vi.fn(async () => {
      await sleep(20);
      return { jevResult: buildJevResult(), jevRequestJson: {} as never, jevResponseJson: {} as never };
    });

    const [a, b] = await Promise.all([
      cache.getOrFetchJev("배송이 늦어요", fetcher),
      cache.getOrFetchJev("배송이 늦어요", fetcher),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(a.value).toBe(b.value);
  });

  it("앞뒤 공백만 다른 텍스트도 같은 문의로 취급한다", async () => {
    const cache = new AnalysisCache();
    const fetcher = vi.fn(async () => ({
      jevResult: buildJevResult(),
      jevRequestJson: {} as never,
      jevResponseJson: {} as never,
    }));

    await cache.getOrFetchJev("  배송이 늦어요  ", fetcher);
    const result = await cache.getOrFetchJev("배송이 늦어요", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.fromCache).toBe(true);
  });

  it("다른 문의 텍스트는 각각 fetcher를 호출한다", async () => {
    const cache = new AnalysisCache();
    const fetcher = vi.fn(async () => ({
      jevResult: buildJevResult(),
      jevRequestJson: {} as never,
      jevResponseJson: {} as never,
    }));

    await cache.getOrFetchJev("배송이 늦어요", fetcher);
    const result = await cache.getOrFetchJev("환불하고 싶어요", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.fromCache).toBe(false);
  });
});

describe("AnalysisCache - Gemini 결과 재사용", () => {
  const reply: GeminiReplyResult = {
    reply: "답변",
    requires_human_review: false,
    internal_note: "",
    fallbackText: false,
  };

  it("문의+브랜드+말투+모델이 모두 같아야 재사용한다", async () => {
    const cache = new AnalysisCache();
    const fetcher = vi.fn(async () => ({ geminiReply: reply, geminiRequestSummary: {} }));

    await cache.getOrFetchGemini("배송 문의", "브랜드A", "polite", "gemini-3.5-flash-lite", fetcher);
    const sameKey = await cache.getOrFetchGemini("배송 문의", "브랜드A", "polite", "gemini-3.5-flash-lite", fetcher);
    const diffTone = await cache.getOrFetchGemini("배송 문의", "브랜드A", "friendly", "gemini-3.5-flash-lite", fetcher);
    const diffBrand = await cache.getOrFetchGemini("배송 문의", "브랜드B", "polite", "gemini-3.5-flash-lite", fetcher);

    expect(sameKey.fromCache).toBe(true);
    expect(diffTone.fromCache).toBe(false);
    expect(diffBrand.fromCache).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
