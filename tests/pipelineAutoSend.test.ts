import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { runPipeline } from "../src/lib/api/pipelineRunner";
import { AnalysisCache } from "../src/lib/api/analysisCache";
import { DEFAULT_SETTINGS } from "../src/types/settings";
import type { InquiryRecord } from "../src/types/pipeline";
import type { ParsedInquiry } from "../src/types/inquiry";

function buildInquiry(overrides: Partial<ParsedInquiry> = {}): ParsedInquiry {
  return {
    rowKey: "row-0",
    inquiry_text: "배송이 늦어요",
    customer_email: "customer@example.com",
    isDuplicate: false,
    isEmpty: false,
    ...overrides,
  };
}

function jevResponseFixture(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    requestBody: {},
    response: {
      answers: {
        category: { choice: "delivery", confidence: 0.9, probabilities: { delivery: 0.9, other: 0.1 } },
        sentiment: { choice: "neutral", confidence: 0.9, probabilities: { neutral: 0.9 } },
        is_urgent: { noul: 0.1 },
        needs_human_review: { noul: 0.1 },
        needs_reply: { noul: 1 },
        severity: { score: 1, confidence: 0.9, probabilities: { "0": 0.1, "1": 0.9 } },
        ...overrides,
      },
    },
  };
}

const geminiResponseFixture = {
  ok: true,
  requestSummary: {},
  result: { reply: "답변입니다.", requires_human_review: false, internal_note: "", fallbackText: false },
  retried: false,
};

describe("파이프라인 자동 발송 안전장치", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let sentToGmail: boolean;
  let jevResponseFixtureForTest: ReturnType<typeof jevResponseFixture>;

  beforeEach(() => {
    sentToGmail = false;
    fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/jev/analyze")) {
        return new Response(JSON.stringify(jevResponseFixtureForTest), { status: 200 });
      }
      if (url.includes("/api/gemini/reply")) {
        return new Response(JSON.stringify(geminiResponseFixture), { status: 200 });
      }
      if (url.includes("/api/gmail/send")) {
        sentToGmail = true;
        return new Response(JSON.stringify({ ok: true, messageId: "msg-1" }), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("사람 검토가 필요한 문의는 자동 발송 설정이 켜져 있어도 절대 이메일을 보내지 않는다", async () => {
    jevResponseFixtureForTest = jevResponseFixture({
      needs_human_review: { noul: 0.95 }, // 사람 검토 필요
    });

    const record: InquiryRecord = { inquiry: buildInquiry(), status: "waiting", approval: "pending" };
    const updates: Partial<InquiryRecord>[] = [];

    await runPipeline([record], {
      jevApiKey: "dummy",
      geminiApiKey: "dummy",
      settings: DEFAULT_SETTINGS,
      generateReplies: true,
      concurrency: 1,
      isAborted: () => false,
      onUpdate: (_key, patch) => updates.push(patch),
      cache: new AnalysisCache(),
      autoSend: { enabled: true, accessToken: "fake-token" },
    });

    expect(sentToGmail).toBe(false);
    const finalPatch = updates[updates.length - 1];
    expect(finalPatch.emailSendStatus).toBeUndefined();
  });

  it("사람 검토가 필요 없는 문의는 자동 발송 설정이 켜져 있으면 이메일을 보낸다", async () => {
    jevResponseFixtureForTest = jevResponseFixture({
      needs_human_review: { noul: 0.05 },
    });

    const record: InquiryRecord = { inquiry: buildInquiry(), status: "waiting", approval: "pending" };
    const updates: Partial<InquiryRecord>[] = [];

    await runPipeline([record], {
      jevApiKey: "dummy",
      geminiApiKey: "dummy",
      settings: DEFAULT_SETTINGS,
      generateReplies: true,
      concurrency: 1,
      isAborted: () => false,
      onUpdate: (_key, patch) => updates.push(patch),
      cache: new AnalysisCache(),
      autoSend: { enabled: true, accessToken: "fake-token" },
    });

    expect(sentToGmail).toBe(true);
    const sentPatch = updates.find((p) => p.emailSendStatus === "sent");
    expect(sentPatch).toBeDefined();
  });

  it("자동 발송이 꺼져 있으면 사람 검토가 필요 없어도 이메일을 보내지 않는다", async () => {
    jevResponseFixtureForTest = jevResponseFixture({
      needs_human_review: { noul: 0.05 },
    });

    const record: InquiryRecord = { inquiry: buildInquiry(), status: "waiting", approval: "pending" };
    const updates: Partial<InquiryRecord>[] = [];

    await runPipeline([record], {
      jevApiKey: "dummy",
      geminiApiKey: "dummy",
      settings: DEFAULT_SETTINGS,
      generateReplies: true,
      concurrency: 1,
      isAborted: () => false,
      onUpdate: (_key, patch) => updates.push(patch),
      cache: new AnalysisCache(),
      autoSend: { enabled: false, accessToken: "fake-token" },
    });

    expect(sentToGmail).toBe(false);
  });
});
