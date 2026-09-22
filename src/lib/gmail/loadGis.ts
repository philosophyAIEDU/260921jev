// Google Identity Services(GIS) 스크립트를 필요할 때만(Gmail 연결을 시도할 때) 불러온다.
let loadPromise: Promise<void> | null = null;

export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google 인증 스크립트를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요."));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
