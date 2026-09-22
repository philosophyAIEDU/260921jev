import { describe, expect, it, beforeEach } from "vitest";
import { loadTemplates, saveTemplates } from "../src/lib/templateStorage";
import { DEFAULT_TEMPLATES } from "../src/types/template";

describe("templateStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장된 값이 없으면 기본 템플릿을 반환한다", () => {
    expect(loadTemplates()).toEqual(DEFAULT_TEMPLATES);
  });

  it("저장한 템플릿을 다시 불러온다", () => {
    const templates = [{ id: "a", label: "테스트", category: "all" as const, text: "안녕하세요" }];
    saveTemplates(templates);
    expect(loadTemplates()).toEqual(templates);
  });

  it("손상된 데이터는 기본 템플릿으로 대체한다", () => {
    localStorage.setItem("jev-smart-desk.reply-templates.v1", "{invalid json");
    expect(loadTemplates()).toEqual(DEFAULT_TEMPLATES);
  });
});
