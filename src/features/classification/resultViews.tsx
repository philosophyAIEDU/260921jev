import type { NormalizedChoice, NormalizedScore } from "../../types/jev";
import { ChoiceIcon, NoulIcon, ScoreIcon } from "../../components/icons";

const CATEGORY_LABELS: Record<string, string> = {
  delivery: "배송",
  payment: "결제",
  refund_exchange: "환불/교환",
  product: "제품",
  account: "계정",
  complaint: "불만",
  compliment: "칭찬/후기",
  spam: "스팸",
  other: "기타",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "긍정",
  neutral: "중립",
  frustrated: "답답함",
  angry: "분노",
  unclear: "불명확",
};

export function labelFor(key: string): string {
  return CATEGORY_LABELS[key] ?? SENTIMENT_LABELS[key] ?? key;
}

export function NoulResultView({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <NoulIcon style={{ color: "var(--noul-color)" }} />
        <span className="badge badge-noul">Noul</span>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</span>
      </div>
      <div className="prob-bar-row">
        <span className="prob-bar-row__label">Yes 확률</span>
        <span className="prob-bar-row__track">
          <span className="prob-bar-row__fill" style={{ width: `${value * 100}%` }} />
        </span>
        <span className="prob-bar-row__value">{(value * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function ChoiceResultView({
  label,
  result,
}: {
  label: string;
  result: NormalizedChoice;
}) {
  const entries = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <ChoiceIcon style={{ color: "var(--choice-color)" }} />
        <span className="badge badge-choice">Choice</span>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</span>
      </div>
      <div style={{ marginBottom: 6, fontSize: 13 }}>
        선택: <strong>{labelFor(result.choice)}</strong>
        <span className="text-muted"> (confidence {(result.confidence * 100).toFixed(0)}%)</span>
      </div>
      {entries.map(([key, value]) => (
        <div className="prob-bar-row" key={key}>
          <span className="prob-bar-row__label">{labelFor(key)}</span>
          <span className="prob-bar-row__track">
            <span className="prob-bar-row__fill" style={{ width: `${value * 100}%` }} />
          </span>
          <span className="prob-bar-row__value">{(value * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

export function ScoreResultView({ label, result }: { label: string; result: NormalizedScore }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <ScoreIcon style={{ color: "var(--score-color)" }} />
        <span className="badge badge-score">Score</span>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</span>
      </div>
      <div style={{ marginBottom: 6, fontSize: 13 }}>
        점수: <strong>{result.score.toFixed(2)}</strong> / {result.maxStage}
        <span className="text-muted"> (confidence {(result.confidence * 100).toFixed(0)}%)</span>
      </div>
      {result.probabilities.map((value, i) => (
        <div className="prob-bar-row" key={i}>
          <span className="prob-bar-row__label">단계 {i}</span>
          <span className="prob-bar-row__track">
            <span className="prob-bar-row__fill score" style={{ width: `${value * 100}%` }} />
          </span>
          <span className="prob-bar-row__value">{(value * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
