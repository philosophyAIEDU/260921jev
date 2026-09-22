export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke(accessToken: string, callback?: () => void): void;
        };
      };
    };
  }
}
