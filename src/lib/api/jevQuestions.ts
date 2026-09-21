import type { JevQuestionSet } from "../../types/jev";

// Jev에 보낼 질문 정의. 학습 모드 화면과 실제 API 요청이 이 정의를 함께 사용한다.
export const JEV_QUESTION_SET: JevQuestionSet = {
  category: {
    type: "choice",
    instructions: "이 고객 문의의 주요 유형은 무엇인가?",
    criteria: {
      delivery: "배송 지연, 배송 상태, 오배송 또는 분실 문의",
      payment: "결제 실패, 중복 결제, 청구 또는 영수증 문의",
      refund_exchange: "환불, 반품 또는 교환 요청",
      product: "제품 정보, 기능, 재고 또는 사용 방법 문의",
      account: "로그인, 계정, 비밀번호 또는 회원정보 문의",
      complaint: "제품 또는 서비스에 대한 일반적인 불만",
      compliment: "감사, 만족 또는 긍정적인 후기",
      spam: "광고, 무관한 내용 또는 반복적인 스팸",
      other: "다른 항목에 해당하지 않는 문의",
    },
  },
  sentiment: {
    type: "choice",
    instructions: "고객이 표현하는 주요 감정은 무엇인가?",
    criteria: {
      positive: "만족, 감사 또는 기대",
      neutral: "감정 표현이 거의 없는 일반적인 문의",
      frustrated: "불편함, 답답함 또는 실망을 표현함",
      angry: "강한 불만, 분노 또는 공격적인 표현",
      unclear: "감정을 판단하기 어려움",
    },
  },
  is_urgent: {
    type: "noul",
    instructions: "이 문의는 신속한 사람의 확인이 필요한가?",
    criteria: {
      true: "중복 결제, 안전, 개인정보, 법적 문제, 서비스 중단 또는 즉각적인 피해가 언급됨",
      false: "일반적인 질문, 후기 또는 기다려도 되는 문의",
    },
  },
  needs_human_review: {
    type: "noul",
    instructions: "자동 답변보다 사람 담당자의 검토가 우선되어야 하는가?",
    criteria: {
      true: "금전, 환불 승인, 안전, 개인정보, 법률, 협박, 심각한 불만 또는 내용이 모호함",
      false: "정책과 템플릿으로 안내 가능한 일반 문의",
    },
  },
  needs_reply: {
    type: "noul",
    instructions: "이 고객 문의에는 답변이 필요한가?",
  },
  severity: {
    type: "score",
    instructions: "고객이 겪고 있는 문제의 심각도를 평가하라.",
    criteria: [
      "문제가 없거나 긍정적인 의견",
      "간단한 안내로 해결할 수 있는 일반 문의",
      "고객이 실제 불편을 겪고 있지만 즉각적인 피해는 크지 않음",
      "금전, 안전, 개인정보 또는 심각한 서비스 피해가 관련됨",
    ],
  },
};

export interface QuestionExplainer {
  key: keyof JevQuestionSet;
  reason: string;
  resultShape: string;
}

// 학습 모드에서 "왜 이 유형을 썼는가"를 설명하기 위한 부가 정보
export const QUESTION_EXPLAINERS: QuestionExplainer[] = [
  {
    key: "category",
    reason:
      "배송, 결제, 환불처럼 순서가 없는 여러 항목 중 하나를 고르는 질문이기 때문에 Choice를 사용합니다.",
    resultShape: "최종 선택, 항목별 probability, confidence",
  },
  {
    key: "sentiment",
    reason:
      "긍정/중립/불만/분노처럼 순서가 없는 감정 상태 중 하나를 고르는 질문이기 때문에 Choice를 사용합니다.",
    resultShape: "최종 선택, 항목별 probability, confidence",
  },
  {
    key: "is_urgent",
    reason: "답이 Yes 또는 No인 질문이기 때문에 Noul을 사용합니다.",
    resultShape: "0부터 1 사이의 Yes 확률",
  },
  {
    key: "needs_human_review",
    reason: "답이 Yes 또는 No인 질문이기 때문에 Noul을 사용합니다.",
    resultShape: "0부터 1 사이의 Yes 확률",
  },
  {
    key: "needs_reply",
    reason: "답이 Yes 또는 No인 질문이기 때문에 Noul을 사용합니다.",
    resultShape: "0부터 1 사이의 Yes 확률",
  },
  {
    key: "severity",
    reason:
      "낮은 단계부터 높은 단계까지 순서가 있는 기준을 평가하는 질문이기 때문에 Score를 사용합니다.",
    resultShape: "단계 사이의 점수, 단계별 probability, confidence",
  },
];
