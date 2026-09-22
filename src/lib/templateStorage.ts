import { DEFAULT_TEMPLATES, type ReplyTemplate } from "../types/template";

// 템플릿은 API Key가 아닌 일반 설정 문구이므로, 세션 간 편의를 위해 localStorage에 저장한다.
// (API Key/OAuth 토큰은 이 파일과 무관하게 항상 메모리에만 유지된다)
const STORAGE_KEY = "jev-smart-desk.reply-templates.v1";

export function loadTemplates(): ReplyTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_TEMPLATES;
    return parsed;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: ReplyTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // 저장 실패(비공개 모드 등)는 조용히 무시한다 - 세션 내 사용에는 지장이 없다
  }
}
