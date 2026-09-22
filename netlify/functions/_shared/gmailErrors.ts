import { classifyHttpStatus, type ProviderErrorKind } from "./providerErrors";

// Gmail(OAuth access token) 전용 오류 메시지. 원본 응답 전문이나 토큰은 절대 포함하지 않는다.
const GMAIL_MESSAGES: Record<ProviderErrorKind, string> = {
  invalid_key: "Google 계정 연결이 만료되었거나 권한이 없습니다. 설정에서 다시 연결해 주세요.",
  quota_exceeded: "Gmail 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  rate_limited: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  network: "네트워크 오류로 Gmail에 연결하지 못했습니다.",
  malformed_response: "Gmail 응답 형식이 올바르지 않습니다.",
  unsupported_model: "요청이 올바르지 않습니다.",
  unknown: "이메일 발송 중 알 수 없는 오류가 발생했습니다.",
};

export interface GmailClassifiedError {
  kind: ProviderErrorKind;
  message: string;
  status: number;
}

export function classifyGmailStatus(status: number): GmailClassifiedError {
  const kind = classifyHttpStatus(status);
  return { kind, message: GMAIL_MESSAGES[kind], status: status >= 500 ? 502 : status };
}

export function gmailNetworkError(): GmailClassifiedError {
  return { kind: "network", message: GMAIL_MESSAGES.network, status: 502 };
}
