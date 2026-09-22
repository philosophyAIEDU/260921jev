import type {
  InquiryCategory,
  JevAnswersRaw,
  JevChoiceAnswerRaw,
  JevResponseRaw,
  JevScoreAnswerRaw,
  NormalizedChoice,
  NormalizedJevResult,
  NormalizedScore,
  Sentiment,
} from "../../types/jev";

export class JevResponseFormatError extends Error {}

// 정규화 원칙
// - 구조가 근본적으로 다르면(필드 없음, 숫자가 아님) 오류를 던진다.
// - 값이 예상 범위를 벗어나거나 모르는 선택지가 오면 던지지 않고 보정한다.
//   제공자가 스펙을 조금 바꿔도 전체 행이 실패하지 않도록 하기 위한 것이다.

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}`);
  }
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}`);
  }
  return value as Record<string, unknown>;
}

function normalizeNoul(raw: unknown, field: string): number {
  const answer = requireObject(raw, field);
  return clamp(requireNumber(answer.noul, `${field}.noul`), 0, 1);
}

function normalizeChoice<T extends string>(raw: unknown, field: string): NormalizedChoice<T> {
  const answer = requireObject(raw, field) as unknown as JevChoiceAnswerRaw;

  if (typeof answer.choice !== "string" || answer.choice.length === 0) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.choice`);
  }
  const confidence = clamp(requireNumber(answer.confidence, `${field}.confidence`), 0, 1);

  const probabilities: Record<string, number> = {};
  const rawProbabilities = requireObject(answer.probabilities, `${field}.probabilities`);
  for (const [key, value] of Object.entries(rawProbabilities)) {
    probabilities[key] = clamp(requireNumber(value, `${field}.probabilities.${key}`), 0, 1);
  }

  // 정의하지 않은 선택지가 오더라도 그대로 통과시킨다 (UI는 원래 키를 그대로 표시)
  return { choice: answer.choice as T, confidence, probabilities };
}

/** 단계 인덱스를 키로 갖는 객체 또는 배열을 단계 순서 배열로 변환한다 */
function toStageArray<T>(source: Record<string, T> | T[]): T[] {
  if (Array.isArray(source)) return source;
  return Object.keys(source)
    .map((key) => ({ key, index: Number(key) }))
    .filter((entry) => Number.isFinite(entry.index))
    .sort((a, b) => a.index - b.index)
    .map((entry) => source[entry.key]);
}

function normalizeScore(raw: unknown, field: string): NormalizedScore {
  const answer = requireObject(raw, field) as unknown as JevScoreAnswerRaw;

  if (
    typeof answer.probabilities !== "object" ||
    answer.probabilities === null
  ) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.probabilities`);
  }

  const probabilities = toStageArray(answer.probabilities).map((value, i) =>
    clamp(requireNumber(value, `${field}.probabilities[${i}]`), 0, 1)
  );
  if (probabilities.length === 0) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.probabilities`);
  }

  const legend = answer.legend ? toStageArray(answer.legend).map((label) => String(label)) : [];
  const maxStage = probabilities.length - 1;
  const confidence = clamp(requireNumber(answer.confidence, `${field}.confidence`), 0, 1);
  const score = clamp(requireNumber(answer.score, `${field}.score`), 0, maxStage);

  return { score, confidence, probabilities, legend, maxStage };
}

/** Jev 원본 응답을 앱에서 사용하는 정규화된 결과로 변환한다 */
export function normalizeJevResponse(raw: JevResponseRaw): NormalizedJevResult {
  if (!raw || typeof raw !== "object" || !("answers" in raw)) {
    throw new JevResponseFormatError("Jev 응답에 answers 필드가 없습니다.");
  }
  const answers = raw.answers as JevAnswersRaw;
  if (!answers || typeof answers !== "object") {
    throw new JevResponseFormatError("Jev 응답 형식이 올바르지 않습니다: answers");
  }

  return {
    category: normalizeChoice<InquiryCategory>(answers.category, "category"),
    sentiment: normalizeChoice<Sentiment>(answers.sentiment, "sentiment"),
    is_urgent: normalizeNoul(answers.is_urgent, "is_urgent"),
    needs_human_review: normalizeNoul(answers.needs_human_review, "needs_human_review"),
    needs_reply: normalizeNoul(answers.needs_reply, "needs_reply"),
    severity: normalizeScore(answers.severity, "severity"),
  };
}
