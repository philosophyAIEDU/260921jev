// @vitest-environment node
//
// Node 환경으로 강제 지정: jsdom은 crypto.subtle(SubtleCrypto)을 구현하지 않지만
// Node는 전역 crypto.subtle을 제공하므로, 순수 암호화 로직만 여기서 직접 검증한다.
// (IndexedDB에 연결된 secureKeyStorage.ts 쪽은 브라우저에서만 의미가 있어 별도로 다루지 않는다)
import { describe, expect, it } from "vitest";
import { decryptValue, encryptValue, generateAesKey } from "../src/lib/secureCrypto";

describe("secureCrypto - API Key 로컬 저장용 암호화", () => {
  it("암호화한 값을 같은 키로 복호화하면 원래 문자열이 나온다", async () => {
    const key = await generateAesKey();
    const payload = await encryptValue(key, "sk-jev-super-secret-key-123");
    const decrypted = await decryptValue(key, payload);
    expect(decrypted).toBe("sk-jev-super-secret-key-123");
  });

  it("암호문은 평문을 그대로 담고 있지 않다", async () => {
    const key = await generateAesKey();
    const payload = await encryptValue(key, "sk-jev-super-secret-key-123");
    expect(payload.data).not.toContain("sk-jev-super-secret-key-123");
    expect(JSON.stringify(payload)).not.toContain("sk-jev-super-secret-key-123");
  });

  it("다른 키로는 복호화할 수 없다 (기기가 바뀌면 복호화 실패로 처리되는 이유)", async () => {
    const key1 = await generateAesKey();
    const key2 = await generateAesKey();
    const payload = await encryptValue(key1, "sk-jev-super-secret-key-123");
    await expect(decryptValue(key2, payload)).rejects.toThrow();
  });

  it("한글 등 UTF-8 문자도 정확히 왕복한다", async () => {
    const key = await generateAesKey();
    const payload = await encryptValue(key, "안녕하세요 API 키입니다");
    const decrypted = await decryptValue(key, payload);
    expect(decrypted).toBe("안녕하세요 API 키입니다");
  });

  it("매번 다른 iv를 사용해 같은 값도 암호문이 달라진다", async () => {
    const key = await generateAesKey();
    const a = await encryptValue(key, "동일한 값");
    const b = await encryptValue(key, "동일한 값");
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });
});
