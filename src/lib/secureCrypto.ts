// AES-GCM 암호화/복호화의 순수 로직만 분리한 모듈이다. CryptoKey를 어디서 구했는지는
// 몰라도 되므로 (IndexedDB 없이) 단독으로 테스트하기 쉽다.

export interface EncryptedPayload {
  iv: string;
  data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptValue(key: CryptoKey, value: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) };
}

export async function decryptValue(key: CryptoKey, payload: EncryptedPayload): Promise<string> {
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) as BufferSource },
    key,
    fromBase64(payload.data) as BufferSource
  );
  return new TextDecoder().decode(plainBuf);
}

export function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
