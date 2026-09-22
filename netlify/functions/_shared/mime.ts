// Gmail API의 users.messages.send는 RFC 2822 메시지 전체를 base64url로 인코딩한
// "raw" 필드를 요구한다. 제목의 한글은 RFC 2047 encoded-word로, 본문은
// Content-Transfer-Encoding: base64로 인코딩해 깨지지 않게 한다.

export function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

export function wrapBase64(base64: string): string {
  return base64.replace(/(.{76})/g, "$1\r\n");
}

export function toBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildRawMessage(to: string, subject: string, body: string): string {
  const bodyBase64 = wrapBase64(Buffer.from(body, "utf-8").toString("base64"));
  const message = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
  ].join("\r\n");

  return toBase64Url(message);
}
