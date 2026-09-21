import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// API Key는 오직 React state(탭 메모리)에만 보관한다.
// localStorage/sessionStorage/IndexedDB/쿠키/파일 어디에도 저장하지 않으며,
// 새로고침하면 자동으로 사라진다. (보안 요구사항 3, 4)

interface ApiKeyState {
  jevApiKey: string;
  geminiApiKey: string;
  setJevApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  hasBothKeys: boolean;
  clearKeys: () => void;
}

const ApiKeyContext = createContext<ApiKeyState | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [jevApiKey, setJevApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  const value = useMemo<ApiKeyState>(
    () => ({
      jevApiKey,
      geminiApiKey,
      setJevApiKey,
      setGeminiApiKey,
      hasBothKeys: jevApiKey.trim().length > 0 && geminiApiKey.trim().length > 0,
      clearKeys: () => {
        setJevApiKey("");
        setGeminiApiKey("");
      },
    }),
    [jevApiKey, geminiApiKey]
  );

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKeys(): ApiKeyState {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKeys는 ApiKeyProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
