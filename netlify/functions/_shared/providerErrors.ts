// 외부 제공자(Jev, Gemini)의 오류를 사용자 친화적인 한국어 메시지로 분류한다.
// 원본 오류 전문이나 API Key는 절대 결과에 포함하지 않는다.

export type ProviderErrorKind =
  | "invalid_key"
  | "quota_exceeded"
  | "rate_limited"
  | "network"
  | "malformed_response"
  | "unsupported_model"
  | "unknown";

export interface ClassifiedError {
  kind: ProviderErrorKind;
  message: string;
  status: number;
}

const MESSAGES: Record<ProviderErrorKind, string> = {
  invalid_key: "API Key가 올바르지 않습니다. 설정 화면에서 키를 다시 확인해 주세요.",
  quota_exceeded: "API 잔액 또는 할당량이 부족합니다. 제공자 콘솔에서 확인해 주세요.",
  rate_limited: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  network: "네트워크 오류로 요청에 실패했습니다. 인터넷 연결을 확인해 주세요.",
  malformed_response: "제공자 응답 형식이 올바르지 않습니다.",
  unsupported_model: "지원하지 않는 모델입니다. 설정 화면에서 모델을 확인해 주세요.",
  unknown: "알 수 없는 오류가 발생했습니다.",
};

export function classifyHttpStatus(status: number): ProviderErrorKind {
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 402) return "quota_exceeded";
  if (status === 429) return "rate_limited";
  if (status === 404) return "unsupported_model";
  if (status >= 500) return "unknown";
  return "unknown";
}

export function classifiedError(kind: ProviderErrorKind, status: number): ClassifiedError {
  return { kind, message: MESSAGES[kind], status };
}

export function networkError(): ClassifiedError {
  return classifiedError("network", 502);
}

export function malformedResponseError(): ClassifiedError {
  return classifiedError("malformed_response", 502);
}
