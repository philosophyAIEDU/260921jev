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
import { INQUIRY_CATEGORIES, SENTIMENTS } from "../../types/jev";

export class JevResponseFormatError extends Error {}

function assertNumberInRange(value: unknown, field: string, min = 0, max = 1): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}`);
  }
  return value;
}

function normalizeNoul(value: unknown, field: string): number {
  if (typeof value === "object" && value !== null && "noul" in value) {
    return assertNumberInRange((value as { noul: unknown }).noul, field);
  }
  return assertNumberInRange(value, field);
}

function normalizeChoice<T extends string>(
  raw: unknown,
  field: string,
  allowed: readonly T[]
): NormalizedChoice<T> {
  if (typeof raw !== "object" || raw === null) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}`);
  }
  const { choice, confidence, probabilities } = raw as JevChoiceAnswerRaw;

  if (typeof choice !== "string" || !allowed.includes(choice as T)) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.choice`);
  }
  assertNumberInRange(confidence, `${field}.confidence`);
  if (typeof probabilities !== "object" || probabilities === null) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.probabilities`);
  }
  for (const [key, prob] of Object.entries(probabilities)) {
    assertNumberInRange(prob, `${field}.probabilities.${key}`);
  }

  return {
    choice: choice as T,
    confidence,
    probabilities: probabilities as Record<string, number>,
  };
}

function normalizeScore(raw: unknown, field: string, maxStage: number): NormalizedScore {
  if (typeof raw !== "object" || raw === null) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}`);
  }
  const { score, confidence, probabilities } = raw as JevScoreAnswerRaw;

  assertNumberInRange(score, `${field}.score`, 0, maxStage);
  assertNumberInRange(confidence, `${field}.confidence`);
  if (!Array.isArray(probabilities)) {
    throw new JevResponseFormatError(`Jev 응답 형식이 올바르지 않습니다: ${field}.probabilities`);
  }
  probabilities.forEach((p, i) => assertNumberInRange(p, `${field}.probabilities[${i}]`));

  return { score, confidence, probabilities, maxStage };
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
    category: normalizeChoice<InquiryCategory>(answers.category, "category", INQUIRY_CATEGORIES),
    sentiment: normalizeChoice<Sentiment>(answers.sentiment, "sentiment", SENTIMENTS),
    is_urgent: normalizeNoul(answers.is_urgent, "is_urgent"),
    needs_human_review: normalizeNoul(answers.needs_human_review, "needs_human_review"),
    needs_reply: normalizeNoul(answers.needs_reply, "needs_reply"),
    severity: normalizeScore(answers.severity, "severity", 3),
  };
}
