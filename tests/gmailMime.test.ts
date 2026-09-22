import { describe, expect, it } from "vitest";
import { buildRawMessage, encodeSubject, toBase64Url } from "../netlify/functions/_shared/mime";

describe("gmail MIME 인코딩", () => {
  it("한글 제목을 RFC 2047 encoded-word로 인코딩한다", () => {
    const encoded = encodeSubject("배송 문의 답변");
    expect(encoded).toMatch(/^=\?UTF-8\?B\?.+\?=$/);
    const base64 = encoded.replace(/^=\?UTF-8\?B\?/, "").replace(/\?=$/, "");
    expect(Buffer.from(base64, "base64").toString("utf-8")).toBe("배송 문의 답변");
  });

  it("base64url은 표준 base64와 달리 +/를 -_로 바꾸고 패딩을 제거한다", () => {
    const encoded = toBase64Url("전에 문의한 건 어떻게 되고 있나요???");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("raw 메시지에 받는 사람과 본문이 모두 포함된 base64url 문자열을 만든다", () => {
    const raw = buildRawMessage("customer@example.com", "문의 답변", "안녕하세요, 확인 후 안내드리겠습니다.");
    // base64url을 다시 표준 base64로 되돌려 디코딩해 내용 확인
    const standard = raw.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(standard, "base64").toString("utf-8");
    expect(decoded).toContain("To: customer@example.com");
    expect(decoded).toContain("Content-Transfer-Encoding: base64");

    const bodyBase64Line = decoded.split("\r\n\r\n")[1];
    const decodedBody = Buffer.from(bodyBase64Line.replace(/\r\n/g, ""), "base64").toString("utf-8");
    expect(decodedBody).toBe("안녕하세요, 확인 후 안내드리겠습니다.");
  });
});
