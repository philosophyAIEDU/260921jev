import { CLEAR_VS_AMBIGUOUS_DEMO, PROBABILITY_VS_CONFIDENCE_HELP } from "./explanations";
import { labelFor } from "../classification/resultViews";

function DemoBars({ probs }: { probs: Record<string, number> }) {
  const entries = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      {entries.map(([k, v]) => (
        <div className="prob-bar-row" key={k}>
          <span className="prob-bar-row__label">{labelFor(k)}</span>
          <span className="prob-bar-row__track">
            <span className="prob-bar-row__fill" style={{ width: `${v * 100}%` }} />
          </span>
          <span className="prob-bar-row__value">{(v * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

export function ProbConfidenceDemo() {
  return (
    <div className="card">
      <h2 className="card-title">Probability와 Confidence는 어떻게 다른가요?</h2>
      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <div className="card" style={{ background: "var(--bg-card-alt)" }}>
          <strong>Probability</strong>
          <p style={{ fontSize: 13.5, marginTop: 6 }}>{PROBABILITY_VS_CONFIDENCE_HELP.probability}</p>
        </div>
        <div className="card" style={{ background: "var(--bg-card-alt)" }}>
          <strong>Confidence</strong>
          <p style={{ fontSize: 13.5, marginTop: 6 }}>{PROBABILITY_VS_CONFIDENCE_HELP.confidence}</p>
        </div>
      </div>

      <div className="two-col">
        <div className="example-case-card">
          <strong>명확한 결과</strong>
          <DemoBars probs={CLEAR_VS_AMBIGUOUS_DEMO.clear} />
          <p className="text-muted" style={{ fontSize: 12.5 }}>
            하나의 항목에 확률이 뚜렷하게 집중되어 confidence가 높습니다.
          </p>
        </div>
        <div className="example-case-card">
          <strong>모호한 결과</strong>
          <DemoBars probs={CLEAR_VS_AMBIGUOUS_DEMO.ambiguous} />
          <p className="text-muted" style={{ fontSize: 12.5 }}>{CLEAR_VS_AMBIGUOUS_DEMO.ambiguousNote}</p>
        </div>
      </div>
    </div>
  );
}
