import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { loadGoogleIdentityServices } from "./loadGis";
import { verifyGmailConnection } from "../api/gmailClient";
import { AppApiError } from "../api/apiErrors";

// Gmail access token은 API Key와 마찬가지로 이 탭의 메모리에만 유지된다.
// 저장소(localStorage 등)에는 절대 저장하지 않으며, 새로고침하면 연결이 해제된다.

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

interface GmailAuthState {
  accessToken: string | null;
  connectedEmail: string | null;
  connecting: boolean;
  error: string | null;
  isConnected: boolean;
  connect: (clientId: string) => Promise<void>;
  disconnect: () => void;
}

const GmailAuthContext = createContext<GmailAuthState | null>(null);

export function GmailAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (clientId: string) => {
    if (!clientId.trim()) {
      setError("Google OAuth 클라이언트 ID를 먼저 입력해 주세요.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await loadGoogleIdentityServices();

      const token = await new Promise<string>((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error("Google 인증 모듈을 불러오지 못했습니다."));
          return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: GMAIL_SEND_SCOPE,
          callback: (response) => {
            if (response.error || !response.access_token) {
              reject(new Error(response.error ?? "Google 인증에 실패했습니다."));
              return;
            }
            resolve(response.access_token);
          },
          error_callback: (err) => {
            reject(new Error(err.message ?? "인증 창이 취소되었습니다."));
          },
        });
        client.requestAccessToken();
      });

      const profile = await verifyGmailConnection(token);
      setAccessToken(token);
      setConnectedEmail(profile.email);
    } catch (err) {
      const message =
        err instanceof AppApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Google 계정 연결에 실패했습니다.";
      setError(message);
      setAccessToken(null);
      setConnectedEmail(null);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    }
    setAccessToken(null);
    setConnectedEmail(null);
    setError(null);
  }, [accessToken]);

  const value = useMemo<GmailAuthState>(
    () => ({
      accessToken,
      connectedEmail,
      connecting,
      error,
      isConnected: Boolean(accessToken),
      connect,
      disconnect,
    }),
    [accessToken, connectedEmail, connecting, error, connect, disconnect]
  );

  return <GmailAuthContext.Provider value={value}>{children}</GmailAuthContext.Provider>;
}

export function useGmailAuth(): GmailAuthState {
  const ctx = useContext(GmailAuthContext);
  if (!ctx) throw new Error("useGmailAuth는 GmailAuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
