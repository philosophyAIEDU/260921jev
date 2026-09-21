import type { Config } from "@netlify/functions";
import { JEV_QUESTION_SET } from "../../src/lib/api/jevQuestions";
import type { JevRequestBody } from "../../src/types/jev";
import { errorResponse, jsonResponse } from "./_shared/http";
import { classifiedError, classifyHttpStatus, networkError } from "./_shared/providerErrors";

const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_MODEL = "jev-latest";

interface AnalyzeRequestBody {
  apiKey?: string;
  model?: string;
  state: {
    inquiry_text: string;
    channel?: string;
    customer_name?: string;
    order_id?: string;
    received_at?: string;
    language?: string;
  };
}

export default async (req: Request): Promise<Response> => {
  let body: AnalyzeRequestBody;
  try {
    body = (await req.json()) as AnalyzeRequestBody;
  } catch {
    return errorResponse("malformed_response", "요청 본문이 올바른 JSON이 아닙니다.", 400);
  }

  const apiKey = body.apiKey;
  if (!apiKey || typeof apiKey !== "string") {
    return errorResponse("invalid_key", "Jev API Key가 전달되지 않았습니다.", 400);
  }
  if (!body.state?.inquiry_text) {
    return errorResponse("malformed_response", "분석할 고객 문의 내용이 없습니다.", 400);
  }

  const requestBody: JevRequestBody = {
    model: body.model || DEFAULT_MODEL,
    state: stripEmpty(body.state),
    questions: JEV_QUESTION_SET,
  };

  let providerResponse: Response;
  try {
    providerResponse = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    // 원본 네트워크 오류 메시지는 로그/응답에 남기지 않는다
    const err = networkError();
    return errorResponse(err.kind, err.message, err.status);
  }

  if (!providerResponse.ok) {
    const kind = classifyHttpStatus(providerResponse.status);
    const err = classifiedError(kind, providerResponse.status >= 500 ? 502 : providerResponse.status);
    return errorResponse(err.kind, err.message, err.status);
  }

  let providerJson: unknown;
  try {
    providerJson = await providerResponse.json();
  } catch {
    const err = classifiedError("malformed_response", 502);
    return errorResponse(err.kind, err.message, err.status);
  }

  // 학습 모드에서 보여줄 수 있도록 실제 요청/응답을 함께 반환한다 (Key는 제외)
  return jsonResponse({
    ok: true,
    requestBody,
    response: providerJson,
  });
};

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  }
  return result as T;
}

export const config: Config = {
  path: "/api/jev/analyze",
  method: ["POST"],
};
