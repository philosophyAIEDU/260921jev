import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearStoredKey, hasStoredKey, loadEncryptedKey, saveEncryptedKey } from "./secureKeyStorage";

// API Key는 기본적으로 React state(탭 메모리)에만 보관되며, 새로고침하면 사라진다.
// 사용자가 각 키 옆의 "이 브라우저에 저장"을 직접 켰을 때만 secureKeyStorage를 통해
// 이 기기 전용 암호화 키로 암호화한 값을 localStorage에 남긴다 (평문 저장 없음).
// 자세한 보호 범위와 한계는 src/lib/secureKeyStorage.ts 상단 주석을 참고.

interface ApiKeyState {
  jevApiKey: string;
  geminiApiKey: string;
  setJevApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  hasBothKeys: boolean;
  clearKeys: () => void;
  rememberJevKey: boolean;
  rememberGeminiKey: boolean;
  setRememberJevKey: (remember: boolean) => void;
  setRememberGeminiKey: (remember: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyState | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [jevApiKey, setJevApiKeyState] = useState("");
  const [geminiApiKey, setGeminiApiKeyState] = useState("");
  const [rememberJevKey, setRememberJevKeyState] = useState(() => hasStoredKey("jev"));
  const [rememberGeminiKey, setRememberGeminiKeyState] = useState(() => hasStoredKey("gemini"));

  // 앱을 새로 열었을 때 "이 브라우저에 저장"이 켜져 있던 키가 있으면 복호화해서 채워 넣는다.
  useEffect(() => {
    if (rememberJevKey) {
      loadEncryptedKey("jev").then((value) => {
        if (value) setJevApiKeyState(value);
      });
    }
    if (rememberGeminiKey) {
      loadEncryptedKey("gemini").then((value) => {
        if (value) setGeminiApiKeyState(value);
      });
    }
    // 최초 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setJevApiKey(key: string) {
    setJevApiKeyState(key);
    if (rememberJevKey) {
      if (key.trim()) void saveEncryptedKey("jev", key);
      else clearStoredKey("jev");
    }
  }

  function setGeminiApiKey(key: string) {
    setGeminiApiKeyState(key);
    if (rememberGeminiKey) {
      if (key.trim()) void saveEncryptedKey("gemini", key);
      else clearStoredKey("gemini");
    }
  }

  function setRememberJevKey(remember: boolean) {
    setRememberJevKeyState(remember);
    if (remember && jevApiKey.trim()) void saveEncryptedKey("jev", jevApiKey);
    if (!remember) clearStoredKey("jev");
  }

  function setRememberGeminiKey(remember: boolean) {
    setRememberGeminiKeyState(remember);
    if (remember && geminiApiKey.trim()) void saveEncryptedKey("gemini", geminiApiKey);
    if (!remember) clearStoredKey("gemini");
  }

  function clearKeys() {
    setJevApiKeyState("");
    setGeminiApiKeyState("");
    clearStoredKey("jev");
    clearStoredKey("gemini");
    setRememberJevKeyState(false);
    setRememberGeminiKeyState(false);
  }

  const value = useMemo<ApiKeyState>(
    () => ({
      jevApiKey,
      geminiApiKey,
      setJevApiKey,
      setGeminiApiKey,
      hasBothKeys: jevApiKey.trim().length > 0 && geminiApiKey.trim().length > 0,
      clearKeys,
      rememberJevKey,
      rememberGeminiKey,
      setRememberJevKey,
      setRememberGeminiKey,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jevApiKey, geminiApiKey, rememberJevKey, rememberGeminiKey]
  );

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKeys(): ApiKeyState {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKeys는 ApiKeyProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
