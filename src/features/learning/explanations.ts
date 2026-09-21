import type { NormalizedChoice, NormalizedScore } from "../../types/jev";
import { labelFor } from "../classification/resultViews";

export function explainNoul(label: string, value: number): string {
  const pct = (value * 100).toFixed(0);
  return `${label} Noul 값은 ${value.toFixed(2)}입니다. 이것은 ${pct}점이라는 뜻이 아니라, "${label}"에 Yes라고 답할 가능성이 약 ${pct}%라는 뜻입니다.`;
}

export function explainChoice(label: string, result: NormalizedChoice): string {
  const sorted = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const second = sorted[1];
  const base = `${label}에서는 ${labelFor(top[0])} 항목이 ${(top[1] * 100).toFixed(0)}%로 가장 높아 선택되었습니다.`;
  if (second && second[1] >= 0.25) {
    return `${base} 하지만 ${labelFor(second[0])} 항목도 ${(second[1] * 100).toFixed(0)}%이므로 두 유형이 섞여 있을 수 있습니다. confidence(${(result.confidence * 100).toFixed(0)}%)가 낮다면 사람이 확인하는 것이 좋습니다.`;
  }
  return `${base} confidence가 ${(result.confidence * 100).toFixed(0)}%로 비교적 뚜렷하게 하나의 항목에 집중되어 있습니다.`;
}

export function explainScore(label: string, result: NormalizedScore): string {
  const lower = Math.floor(result.score);
  const upper = Math.min(lower + 1, result.maxStage);
  const closerToUpper = result.score - lower > 0.5;
  return `${label}는 ${result.score.toFixed(2)} / ${result.maxStage}입니다. 이것은 100점 만점 점수가 아닙니다. 사용자가 정의한 0~${result.maxStage} 단계에서 ${lower}단계와 ${upper}단계 사이에 있으며, ${closerToUpper ? `${upper}단계에 더 가깝습니다.` : `${lower}단계에 더 가깝습니다.`}`;
}

export const PROBABILITY_VS_CONFIDENCE_HELP = {
  probability: "각 선택지 또는 단계가 맞을 가능성입니다.",
  confidence:
    "확률이 하나의 선택지나 단계에 얼마나 집중되어 있는지를 요약한 값입니다. confidence가 높다고 현실에서 반드시 정답이라는 뜻은 아닙니다.",
};

export const CLEAR_VS_AMBIGUOUS_DEMO = {
  clear: { delivery: 0.95, payment: 0.03, other: 0.02 },
  ambiguous: { delivery: 0.48, refund_exchange: 0.42, other: 0.1 },
  ambiguousNote: "가장 높은 항목은 배송이지만 자동 처리하기에는 모호할 수 있습니다.",
};
