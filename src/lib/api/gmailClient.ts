import { AppApiError } from "./apiErrors";

export interface GmailProfile {
  email: string;
}

export async function verifyGmailConnection(accessToken: string): Promise<GmailProfile> {
  const res = await fetch("/api/gmail/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new AppApiError(json.errorKind ?? "unknown", json.message ?? "Gmail 연결 확인에 실패했습니다.");
  }
  return { email: json.email };
}

export interface SendEmailParams {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
}

export async function sendGmailMessage(params: SendEmailParams): Promise<void> {
  const res = await fetch("/api/gmail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new AppApiError(json.errorKind ?? "unknown", json.message ?? "이메일 발송에 실패했습니다.");
  }
}
