import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ApiKeyProvider, useApiKeys } from "../src/lib/apiKeyContext";

function TestConsumer() {
  const { jevApiKey, geminiApiKey, setJevApiKey, setGeminiApiKey } = useApiKeys();
  return (
    <div>
      <input aria-label="jev-key" value={jevApiKey} onChange={(e) => setJevApiKey(e.target.value)} />
      <input aria-label="gemini-key" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} />
    </div>
  );
}

describe("API Key는 저장소에 남지 않는다", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    cleanup();
  });

  it("키를 입력해도 localStorage/sessionStorage에 저장되지 않는다", () => {
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
  });

  it("새로고침(리마운트)하면 키가 초기화된다", () => {
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
