import type { JevRequestBody, JevResponseRaw, NormalizedJevResult } from "../../types/jev";
import type { GeminiReplyResult } from "../../types/gemini";

interface CachedJevResult {
  jevResult: NormalizedJevResult;
  jevRequestJson: JevRequestBody;
  jevResponseJson: JevResponseRaw;
}

interface CachedGeminiResult {
  geminiReply: GeminiReplyResult;
  geminiRequestSummary: Record<string, unknown>;
}

export interface CacheLookup<T> {
  value: T;
  fromCache: boolean;
}

/**
 * 세션 내에서 완전히 동일한 문의 내용을 다시 분석할 때 Jev/Gemini API를 재호출하지 않도록
 * 결과를 캐시한다. 새로고침하면 사라지는 메모리 캐시이며, 저장소에는 남지 않는다.
 *
 * 동시성 파이프라인에서는 완료된 결과뿐 아니라 "진행 중인 요청"도 공유해야 한다.
 * 그렇지 않으면 동일한 문의를 가진 두 행이 거의 동시에 처리될 때 캐시가 채워지기 전에
 * 둘 다 API를 호출해 버려 캐싱 효과가 사라진다 (요청 완료 후에야 캐시에 쓰이기 때문).
 * getOrFetchJev/getOrFetchGemini는 진행 중인 Promise를 재사용해 이 경쟁 상태를 막는다.
 */
export class AnalysisCache {
  private jevCache = new Map<string, CachedJevResult>();
  private jevInFlight = new Map<string, Promise<CachedJevResult>>();
  private geminiCache = new Map<string, CachedGeminiResult>();
  private geminiInFlight = new Map<string, Promise<CachedGeminiResult>>();
  private hitCount = 0;

  private normalizeText(text: string): string {
    return text.trim();
  }

  private geminiKey(text: string, brand: string, tone: string, model: string): string {
    return `${this.normalizeText(text)}\u0000${brand}\u0000${tone}\u0000${model}`;
  }

  async getOrFetchJev(
    text: string,
    fetcher: () => Promise<CachedJevResult>
  ): Promise<CacheLookup<CachedJevResult>> {
    const key = this.normalizeText(text);

    const cached = this.jevCache.get(key);
    if (cached) {
      this.hitCount += 1;
      return { value: cached, fromCache: true };
    }

    const inFlight = this.jevInFlight.get(key);
    if (inFlight) {
      this.hitCount += 1;
      return { value: await inFlight, fromCache: true };
    }

    const promise = fetcher().then((value) => {
      this.jevCache.set(key, value);
      return value;
    });
    this.jevInFlight.set(key, promise);
    try {
      const value = await promise;
      return { value, fromCache: false };
    } finally {
      this.jevInFlight.delete(key);
    }
  }

  async getOrFetchGemini(
    text: string,
    brand: string,
    tone: string,
    model: string,
    fetcher: () => Promise<CachedGeminiResult>
  ): Promise<CacheLookup<CachedGeminiResult>> {
    const key = this.geminiKey(text, brand, tone, model);

    const cached = this.geminiCache.get(key);
    if (cached) {
      this.hitCount += 1;
      return { value: cached, fromCache: true };
    }

    const inFlight = this.geminiInFlight.get(key);
    if (inFlight) {
      this.hitCount += 1;
      return { value: await inFlight, fromCache: true };
    }

    const promise = fetcher().then((value) => {
      this.geminiCache.set(key, value);
      return value;
    });
    this.geminiInFlight.set(key, promise);
    try {
      const value = await promise;
      return { value, fromCache: false };
    } finally {
      this.geminiInFlight.delete(key);
    }
  }

  getHitCount(): number {
    return this.hitCount;
  }
}
