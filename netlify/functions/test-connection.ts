import type { Config } from "@netlify/functions";
import { errorResponse, jsonResponse } from "./_shared/http";
import { classifiedError, classifyHttpStatus, networkError } from "./_shared/providerErrors";

interface TestConnectionBody {
  provider?: "jev" | "gemini";
  apiKey?: string;
  model?: string;
}

const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export default async (req: Request): Promise<Response> => {
  let body: TestConnectionBody;
  try {
    body = (await req.json()) as TestConnectionBody;
  } catch {
    return errorResponse("malformed_response", "요청 본문이 올바른 JSON이 아닙니다.", 400);
  }

  if (!body.apiKey || typeof body.apiKey !== "string") {
    return errorResponse("invalid_key", "API Key가 전달되지 않았습니다.", 400);
  }

  try {
    if (body.provider === "jev") {
      return await testJev(body.apiKey, body.model || "jev-latest");
    }
    if (body.provider === "gemini") {
      return await testGemini(body.apiKey, body.model || "gemini-3.5-flash-lite");
    }
    return errorResponse("malformed_response", "provider 값은 jev 또는 gemini여야 합니다.", 400);
  } catch {
    const err = networkError();
    return errorResponse(err.kind, err.message, err.status);
  }
};

async function testJev(apiKey: string, model: string): Promise<Response> {
  const response = await fetch(JEV_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      state: { inquiry_text: "연결 테스트용 샘플 문의입니다." },
      questions: {
        needs_reply: { type: "noul", instructions: "이 문의에는 답변이 필요한가?" },
      },
    }),
  });

  if (!response.ok) {
    const kind = classifyHttpStatus(response.status);
    const err = classifiedError(kind, response.status >= 500 ? 502 : response.status);
    return errorResponse(err.kind, err.message, err.status);
  }
  return jsonResponse({ ok: true, provider: "jev" });
}

async function testGemini(apiKey: string, model: string): Promise<Response> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "연결 테스트입니다. '테스트 성공'이라고만 답하세요." }] }],
        generationConfig: { maxOutputTokens: 20 },
      }),
    }
  );

  if (!response.ok) {
    const kind = classifyHttpStatus(response.status);
    const err = classifiedError(kind, response.status >= 500 ? 502 : response.status);
    return errorResponse(err.kind, err.message, err.status);
  }
  return jsonResponse({ ok: true, provider: "gemini" });
}

export const config: Config = {
  path: "/api/test-connection",
  method: ["POST"],
};
