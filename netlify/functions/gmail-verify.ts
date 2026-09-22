import type { Config } from "@netlify/functions";
import { errorResponse, jsonResponse } from "./_shared/http";
import { classifyGmailStatus, gmailNetworkError } from "./_shared/gmailErrors";

interface VerifyRequestBody {
  accessToken?: string;
}

// Gmail 계정 연결 확인용. access token은 브라우저 메모리에만 있던 값을 이 요청에서만
// 사용하며, 서버에 저장하거나 로그에 남기지 않는다.
export default async (req: Request): Promise<Response> => {
  let body: VerifyRequestBody;
  try {
    body = (await req.json()) as VerifyRequestBody;
  } catch {
    return errorResponse("malformed_response", "요청 본문이 올바른 JSON이 아닙니다.", 400);
  }

  if (!body.accessToken) {
    return errorResponse("invalid_key", "Google 계정이 연결되어 있지 않습니다.", 400);
  }

  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${body.accessToken}` },
    });
  } catch {
    const err = gmailNetworkError();
    return errorResponse(err.kind, err.message, err.status);
  }

  if (!response.ok) {
    const err = classifyGmailStatus(response.status);
    return errorResponse(err.kind, err.message, err.status);
  }

  let profile: unknown;
  try {
    profile = await response.json();
  } catch {
    const err = classifyGmailStatus(502);
    return errorResponse(err.kind, err.message, err.status);
  }

  const email = (profile as { emailAddress?: string }).emailAddress;
  if (!email) {
    const err = classifyGmailStatus(502);
    return errorResponse(err.kind, err.message, err.status);
  }

  return jsonResponse({ ok: true, email });
};

export const config: Config = {
  path: "/api/gmail/verify",
  method: ["POST"],
};
