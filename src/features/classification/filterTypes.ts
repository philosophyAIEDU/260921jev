import type { RowStatus } from "../../types/pipeline";

export interface FilterState {
  category: string;
  sentiment: string;
  urgentOnly: boolean;
  needsReviewOnly: boolean;
  status: RowStatus | "all";
  keyword: string;
}

export const DEFAULT_FILTERS: FilterState = {
  category: "all",
  sentiment: "all",
  urgentOnly: false,
  needsReviewOnly: false,
  status: "all",
  keyword: "",
};
