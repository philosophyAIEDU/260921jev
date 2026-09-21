export interface SampleInquiry {
  id: string;
  text: string;
  note: string;
}

// 학습 모드 예제 데이터 및 샘플 파일 다운로드에 공통으로 사용
export const SAMPLE_INQUIRIES: SampleInquiry[] = [
  {
    id: "delivery-clear",
    text: "상품이 출발했다고 하는데 일주일째 도착하지 않았습니다.",
    note: "배송 지연이라는 사실이 분명하게 드러나 유형과 감정을 판단하기 쉬운 명확한 사례입니다.",
  },
  {
    id: "payment-refund-mixed",
    text: "결제가 두 번 됐습니다. 한 건은 취소해 주세요.",
    note: "결제 오류와 환불 요청이 섞여 있어 결제/환불 두 유형에 확률이 나뉠 수 있는 사례입니다.",
  },
  {
    id: "compliment",
    text: "제품이 정말 마음에 듭니다. 다음에도 구매하겠습니다.",
    note: "긍정적인 감정과 후기 유형이 뚜렷하게 드러나는 명확한 사례입니다.",
  },
  {
    id: "ambiguous",
    text: "전에 문의한 건 어떻게 되고 있나요?",
    note: "무엇에 대한 문의인지 맥락이 없어 유형 판단이 모호할 수 있는 사례입니다.",
  },
  {
    id: "safety-urgent",
    text: "충전 중 제품에서 연기가 나서 바로 전원을 뽑았습니다.",
    note: "안전과 관련된 즉각적인 위험이 언급되어 긴급도와 심각도가 매우 높게 나오는 사례입니다.",
  },
];

export function buildSampleCsv(): string {
  const header = "inquiry_id,received_at,channel,customer_name,order_id,inquiry_text";
  const rows = SAMPLE_INQUIRIES.map((s, i) => {
    const id = `INQ-${1000 + i}`;
    const date = "2026-09-1" + i;
    const channel = ["이메일", "채팅", "전화", "게시판", "채팅"][i % 5];
    const name = `고객${i + 1}`;
    const order = `ORD-${20000 + i}`;
    const text = s.text.replace(/"/g, '""');
    return `${id},${date},${channel},${name},${order},"${text}"`;
  });
  return [header, ...rows].join("\n");
}

export function downloadSampleCsv(): void {
  const csv = buildSampleCsv();
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jev-smart-desk-sample.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
