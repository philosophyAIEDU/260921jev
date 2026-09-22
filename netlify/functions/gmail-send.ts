import type { Config } from "@netlify/functions";
import { errorResponse, jsonResponse } from "./_shared/http";
import { classifyGmailStatus, gmailNetworkError } from "./_shared/gmailErrors";
import { buildRawMessage } from "./_shared/mime";

interface SendRequestBody {
  accessToken?: string;
  to?: string;
  subject?: string;
  body?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 승인된 답변을 실제로 Gmail을 통해 발송한다. access token/제목/본문은 이 요청에서만
// 사용하고 저장하거나 로그에 남기지 않는다.
export default async (req: Request): Promise<Response> => {
  let body: SendRequestBody;
  try {
    body = (await req.json()) as SendRequestBody;
  } catch {
    return errorResponse("malformed_response", "요청 본문이 올바른 JSON이 아닙니다.", 400);
  }

  if (!body.accessToken) {
    return errorResponse("invalid_key", "Google 계정이 연결되어 있지 않습니다.", 400);
  }
  if (!body.to || !EMAIL_PATTERN.test(body.to)) {
    return errorResponse("malformed_response", "받는 사람 이메일 주소가 올바르지 않습니다.", 400);
  }
  if (!body.subject || !body.body) {
    return errorResponse("malformed_response", "이메일 제목과 본문이 필요합니다.", 400);
  }

  const raw = buildRawMessage(body.to, body.subject, body.body);

  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
  } catch {
    const err = gmailNetworkError();
    return errorResponse(err.kind, err.message, err.status);
  }

  if (!response.ok) {
    const err = classifyGmailStatus(response.status);
    return errorResponse(err.kind, err.message, err.status);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    const err = classifyGmailStatus(502);
    return errorResponse(err.kind, err.message, err.status);
  }

  const messageId = (result as { id?: string }).id;
  return jsonResponse({ ok: true, messageId: messageId ?? null });
};

export const config: Config = {
  path: "/api/gmail/send",
  method: ["POST"],
};
