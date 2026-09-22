import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

// secureKeyStorage는 실제로는 IndexedDB(비추출 CryptoKey) + Web Crypto가 필요한데,
// jsdom 테스트 환경에는 둘 다 없다. 여기서는 ApiKeyProvider가 "이 브라우저에 저장" 토글에
// 맞춰 저장/불러오기/삭제 함수를 올바르게 호출하는지(연결 로직)만 검증하고,
// 암호화 자체의 정확성은 tests/secureCrypto.test.ts에서 별도로 검증한다.
const fakeStore = new Map<string, string>();
vi.mock("../src/lib/secureKeyStorage", () => ({
  saveEncryptedKey: vi.fn(async (name: string, value: string) => {
    fakeStore.set(name, value);
  }),
  loadEncryptedKey: vi.fn(async (name: string) => fakeStore.get(name) ?? null),
  clearStoredKey: vi.fn((name: string) => {
    fakeStore.delete(name);
  }),
  hasStoredKey: vi.fn((name: string) => fakeStore.has(name)),
}));

import { ApiKeyProvider, useApiKeys } from "../src/lib/apiKeyContext";

function TestConsumer() {
  const {
    jevApiKey,
    geminiApiKey,
    setJevApiKey,
    setGeminiApiKey,
    rememberJevKey,
    setRememberJevKey,
  } = useApiKeys();
  return (
    <div>
      <input aria-label="jev-key" value={jevApiKey} onChange={(e) => setJevApiKey(e.target.value)} />
      <input aria-label="gemini-key" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} />
      <label>
        <input
          type="checkbox"
          aria-label="remember-jev"
          checked={rememberJevKey}
          onChange={(e) => setRememberJevKey(e.target.checked)}
        />
        remember jev
      </label>
    </div>
  );
}

describe("API Key는 기본적으로 저장소에 남지 않는다", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    fakeStore.clear();
    cleanup();
  });

  it("'이 브라우저에 저장'을 켜지 않으면 localStorage/sessionStorage에 저장되지 않는다", () => {
    render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );

    fireEvent.change(screen.getByLabelText("jev-key"), { target: { value: "sk-jev-secret-123" } });
    fireEvent.change(screen.getByLabelText("gemini-key"), { target: { value: "AIza-secret-456" } });

    expect(screen.getByLabelText("jev-key")).toHaveValue("sk-jev-secret-123");

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      expect(localStorage.getItem(key)).not.toContain("sk-jev-secret-123");
      expect(localStorage.getItem(key)).not.toContain("AIza-secret-456");
    }
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(fakeStore.size).toBe(0);
  });

  it("저장을 켜지 않은 채로 새로고침(리마운트)하면 키가 초기화된다", () => {
    const { unmount } = render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );
    fireEvent.change(screen.getByLabelText("jev-key"), { target: { value: "sk-jev-secret-123" } });
    unmount();

    render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );
    expect(screen.getByLabelText("jev-key")).toHaveValue("");
  });
});

describe("'이 브라우저에 저장'을 직접 켰을 때만 유지된다", () => {
  beforeEach(() => {
    localStorage.clear();
    fakeStore.clear();
    cleanup();
  });

  it("저장을 켜면 값을 암호화 저장소에 넘기고, 리마운트해도 복원된다", async () => {
    const { unmount } = render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );

    fireEvent.click(screen.getByLabelText("remember-jev"));
    fireEvent.change(screen.getByLabelText("jev-key"), { target: { value: "sk-jev-secret-123" } });

    await waitFor(() => expect(fakeStore.get("jev")).toBe("sk-jev-secret-123"));

    unmount();

    render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );
    await waitFor(() => expect(screen.getByLabelText("jev-key")).toHaveValue("sk-jev-secret-123"));
  });

  it("저장을 다시 끄면 저장된 값을 지운다", async () => {
    render(
      <ApiKeyProvider>
        <TestConsumer />
      </ApiKeyProvider>
    );

    fireEvent.click(screen.getByLabelText("remember-jev"));
    fireEvent.change(screen.getByLabelText("jev-key"), { target: { value: "sk-jev-secret-123" } });
    await waitFor(() => expect(fakeStore.has("jev")).toBe(true));

    fireEvent.click(screen.getByLabelText("remember-jev"));
    expect(fakeStore.has("jev")).toBe(false);
  });
});
