// API Key를 사용자가 "이 브라우저에 저장"으로 직접 켰을 때만 사용되는 모듈이다.
// 기본값은 저장하지 않는 것(탭 메모리에만 유지)이며, 이 모듈은 그 기본값을 바꾸지 않는다.
//
// 저장 방식: 이 기기·이 브라우저 프로필에서만 사용할 수 있는 추출 불가능한(non-extractable)
// AES-GCM CryptoKey를 IndexedDB에 만들어 두고, 그 키로 암호화한 값만 localStorage에 남긴다.
// 실제 암호화/복호화 로직은 secureCrypto.ts에 분리되어 있다.
//
// 이것이 지켜주는 것: localStorage를 통째로 복사해 다른 기기로 가져가거나, 값을 얼핏 들여다봐도
// (예: 화면 공유 중 devtools) API Key 평문이 그대로 노출되지는 않는다.
//
// 이것이 지켜주지 못하는 것: 이 페이지에서 실행되는 악성 스크립트(XSS)나, 이 브라우저 프로필 자체에
// 대한 접근 권한이 있는 사람은 이 모듈이 하는 것과 똑같이 복호화해 값을 읽을 수 있다.
// 즉 "전송 중 노출"이 아니라 "화면 너머로 무심코 노출"되는 상황에 대한 보완일 뿐,
// 공용 컴퓨터에서 사용해도 안전하다는 뜻은 아니다.

import { decryptValue, encryptValue, generateAesKey, type EncryptedPayload } from "./secureCrypto";

const DB_NAME = "jev-smart-desk-keystore";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const DEVICE_KEY_ID = "device-key";
const STORAGE_PREFIX = "jev-smart-desk.secure-key.";

function isSupported(): boolean {
  return (
    typeof indexedDB !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const db = await openDb();
  try {
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(DEVICE_KEY_ID);
      req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
      req.onerror = () => reject(req.error);
    });
    if (existing) return existing;

    const key = await generateAesKey();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(key, DEVICE_KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return key;
  } finally {
    db.close();
  }
}

export async function saveEncryptedKey(name: string, value: string): Promise<void> {
  if (!isSupported()) return;
  const key = await getOrCreateDeviceKey();
  const payload = await encryptValue(key, value);
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(payload));
}

export async function loadEncryptedKey(name: string): Promise<string | null> {
  if (!isSupported()) return null;
  const raw = localStorage.getItem(STORAGE_PREFIX + name);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as EncryptedPayload;
    const key = await getOrCreateDeviceKey();
    return await decryptValue(key, payload);
  } catch {
    // 복호화 실패(다른 기기로 프로필을 옮긴 경우 등) 시 조용히 무시하고 손상된 값을 지운다
    localStorage.removeItem(STORAGE_PREFIX + name);
    return null;
  }
}

export function clearStoredKey(name: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + name);
  } catch {
    // 저장소 접근 불가(비공개 모드 등)는 무시한다
  }
}

export function hasStoredKey(name: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + name) !== null;
  } catch {
    return false;
  }
}
