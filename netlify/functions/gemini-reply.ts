import type { Config } from "@netlify/functions";
import {
  GEMINI_RESPONSE_SCHEMA,
  buildGeminiSystemInstruction,
  buildGeminiUserPrompt,
} from "../../src/lib/api/geminiPrompt";
import { fallbackToPlainText, tryParseGeminiJson } from "../../src/lib/api/geminiParse";
import type { GeminiReplyContext } from "../../src/types/gemini";
import { errorResponse, jsonResponse } from "./_shared/http";
import { classifiedError, classifyHttpStatus, networkError } from "./_shared/providerErrors";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

interface GeminiRequestBody {
  apiKey?: string;
  model?: string;
  context: GeminiReplyContext;
}

export default async (req: Request): Promise<Response> => {
  let body: GeminiRequestBody;
  try {
    body = (await req.json()) as GeminiRequestBody;
  } catch {
    return errorResponse("malformed_response", "요청 본문이 올바른 JSON이 아닙니다.", 400);
  }

  const apiKey = body.apiKey;
  if (!apiKey || typeof apiKey !== "string") {
    return errorResponse("invalid_key", "Gemini API Key가 전달되지 않았습니다.", 400);
  }
  if (!body.context?.inquiryText) {
    return errorResponse("malformed_response", "답변을 생성할 고객 문의 내용이 없습니다.", 400);
  }

  const model = body.model || DEFAULT_MODEL;
  const systemInstruction = buildGeminiSystemInstruction(body.context.brandName, body.context.tone);
  const userPrompt = buildGeminiUserPrompt(body.context);

  const callGemini = () => callGeminiApi(apiKey, model, systemInstruction, userPrompt);

  let text: string;
  try {
    const first = await callGemini();
    if (!first.ok) {
      return errorResponse(first.error.kind, first.error.message, first.error.status);
    }
    text = first.text;
  } catch {
    const err = networkError();
    return errorResponse(err.kind, err.message, err.status);
  }

  let parsed = tryParseGeminiJson(text);
  let retried = false;

  if (!parsed) {
    // JSON 파싱 실패 시 1회만 재시도
    retried = true;
    try {
      const second = await callGemini();
      if (second.ok) {
        parsed = tryParseGeminiJson(second.text);
        if (!parsed) parsed = fallbackToPlainText(second.text);
      } else {
        parsed = fallbackToPlainText(text);
      }
    } catch {
      parsed = fallbackToPlainText(text);
    }
  }

  return jsonResponse({
    ok: true,
    requestSummary: { model, systemInstruction, userPrompt },
    result: parsed,
    retried,
  });
};

interface GeminiCallSuccess {
  ok: true;
  text: string;
}
interface GeminiCallFailure {
  ok: false;
  error: { kind: string; message: string; status: number };
}

async function callGeminiApi(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiCallSuccess | GeminiCallFailure> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const kind = classifyHttpStatus(response.status);
    const err = classifiedError(kind, response.status >= 500 ? 502 : response.status);
    return { ok: false, error: err };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    const err = classifiedError("malformed_response", 502);
    return { ok: false, error: err };
  }

  const text = extractGeminiText(json);
  if (text === null) {
    const err = classifiedError("malformed_response", 502);
    return { ok: false, error: err };
  }

  return { ok: true, text };
}

function extractGeminiText(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return null;
  const candidates = (json as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const textPart = parts.find((p) => typeof (p as { text?: unknown })?.text === "string");
  return (textPart as { text?: string })?.text ?? null;
}

export const config: Config = {
  path: "/api/gemini/reply",
  method: ["POST"],
};
