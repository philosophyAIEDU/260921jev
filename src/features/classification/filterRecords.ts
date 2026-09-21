import type { InquiryRecord } from "../../types/pipeline";
import type { FilterState } from "./filterTypes";

export function filterRecords(records: InquiryRecord[], filters: FilterState): InquiryRecord[] {
  return records.filter((r) => {
    if (filters.category !== "all" && r.jevResult?.category.choice !== filters.category) return false;
    if (filters.sentiment !== "all" && r.jevResult?.sentiment.choice !== filters.sentiment) return false;
    if (filters.urgentOnly && !r.policy?.isUrgent) return false;
    if (filters.needsReviewOnly && !r.policy?.needsHumanReview) return false;
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.keyword.trim()) {
      const kw = filters.keyword.trim().toLowerCase();
      if (!r.inquiry.inquiry_text.toLowerCase().includes(kw)) return false;
    }
    return true;
  });
}
