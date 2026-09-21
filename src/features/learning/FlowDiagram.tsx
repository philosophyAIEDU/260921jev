export function FlowDiagram() {
  const steps = [
    { title: "State", desc: "고객이 작성한 원문 또는 구조화된 고객 정보" },
    { title: "Questions", desc: "Jev가 판단할 Noul, Choice, Score 질문들" },
    { title: "Answers", desc: "확률, 선택 결과, 점수 및 confidence" },
    { title: "App Rules", desc: "임계값과 조건문으로 긴급 표시, 사람 검토 여부 결정" },
    { title: "Gemini Reply", desc: "분류 결과를 참고해 작성한 맞춤 답변 초안" },
  ];

  return (
    <div className="card">
      <h3 className="card-title" style={{ fontSize: 15 }}>
        State → Questions → Answers → App Rules → Gemini Reply
      </h3>
      <div className="flow-diagram">
        {steps.map((s, i) => (
          <div key={s.title} style={{ display: "contents" }}>
            <div className="flow-diagram__step">
              <span className="flow-diagram__step-num">{i + 1}</span>
              <span className="flow-diagram__step-title">{s.title}</span>
              <span className="flow-diagram__step-desc">{s.desc}</span>
            </div>
            {i < steps.length - 1 && <div className="flow-diagram__arrow">→</div>}
          </div>
        ))}
      </div>
      <div className="summary-strip" style={{ marginTop: 12 }}>
        Jev가 판단하고, 앱의 규칙이 다음 행동을 결정하며, Gemini가 고객에게 보여 줄 답변을
        작성합니다.
      </div>
    </div>
  );
}
