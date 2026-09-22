import { useCallback, useState } from "react";
import type { ReplyTemplate } from "../types/template";
import { loadTemplates, saveTemplates } from "./templateStorage";

export function useReplyTemplates() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>(() => loadTemplates());

  const addTemplate = useCallback((template: Omit<ReplyTemplate, "id">) => {
    setTemplates((prev) => {
      const next = [...prev, { ...template, id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
      saveTemplates(next);
      return next;
    });
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTemplates(next);
      return next;
    });
  }, []);

  return { templates, addTemplate, removeTemplate };
}
