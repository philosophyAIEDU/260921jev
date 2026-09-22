import type { InquiryCategory } from "./jev";

export interface ReplyTemplate {
  id: string;
  label: string;
  /** "all"이면 모든 유형에서 노출 */
  category: InquiryCategory | "all";
  text: string;
}

export const DEFAULT_TEMPLATES: ReplyTemplate[] = [
  {
    id: "tpl-default-1",
    label: "배송 지연 안내",
    category: "delivery",
    text: "불편을 드려 죄송합니다. 주문번호를 알려주시면 현재 배송 상태를 확인한 뒤 다시 안내드리겠습니다.",
  },
  {
    id: "tpl-default-2",
    label: "환불/교환 접수 안내",
    category: "refund_exchange",
    text: "불편을 드려 죄송합니다. 정확한 확인을 위해 담당자가 주문 내역을 살펴본 뒤 별도로 안내드리겠습니다.",
  },
  {
    id: "tpl-default-3",
    label: "감사 인사",
    category: "compliment",
    text: "소중한 후기 감사합니다. 앞으로도 더 나은 모습으로 보답하겠습니다.",
  },
  {
    id: "tpl-default-4",
    label: "일반 확인 중 안내",
    category: "all",
    text: "문의 주신 내용 확인했습니다. 정확한 안내를 위해 담당자가 검토 후 다시 연락드리겠습니다.",
  },
];
