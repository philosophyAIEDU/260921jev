import { ChoiceIcon, NoulIcon, ScoreIcon } from "../../components/icons";

export function ConceptIntroCards() {
  return (
    <div className="card">
      <h2 className="card-title">Jev의 세 가지 질문 유형</h2>
      <p className="card-subtitle">
        Jev는 상황(State)에 대해 세 가지 유형의 질문을 던지고 답을 구조화된 형태로 돌려줍니다.
      </p>
      <div className="concept-cards">
        <div className="concept-card type-noul">
          <div className="concept-card__icon">
            <NoulIcon width={28} height={28} style={{ color: "var(--noul-color)" }} />
          </div>
          <div className="concept-card__title">Noul — 해당하나요?</div>
          <div className="concept-card__desc">
            예 또는 아니요로 판단할 수 있는 질문입니다. 결과 숫자는 정도 점수가 아니라 Yes일
            확률입니다.
          </div>
          <div className="concept-card__example">
            예시 질문: "이 문의는 긴급한가?"
            <br />
            예시 결과: 0.92 → 긴급하다는 답이 Yes일 가능성이 약 92%
          </div>
        </div>

        <div className="concept-card type-choice">
          <div className="concept-card__icon">
            <ChoiceIcon width={28} height={28} style={{ color: "var(--choice-color)" }} />
          </div>
          <div className="concept-card__title">Choice — 무엇에 해당하나요?</div>
          <div className="concept-card__desc">
            미리 정한 여러 항목 가운데 가장 적합한 하나를 선택합니다. 각 항목의 probability와
            전체 분포의 집중 정도를 나타내는 confidence를 함께 확인합니다.
          </div>
          <div className="concept-card__example">
            예시 질문: "배송, 결제, 환불 중 어떤 문의인가?"
            <br />
            예시 결과: 결제 0.78, 환불 0.18, 기타 0.04
          </div>
        </div>

        <div className="concept-card type-score">
          <div className="concept-card__icon">
            <ScoreIcon width={28} height={28} style={{ color: "var(--score-color)" }} />
          </div>
          <div className="concept-card__title">Score — 어느 수준인가요?</div>
          <div className="concept-card__desc">
            사용자가 구체적으로 작성한 순서 있는 단계 중 어느 위치에 가까운지를 평가합니다.
            100점 만점 점수가 아닙니다.
          </div>
          <div className="concept-card__example">
            예시 질문: "문제의 심각도는 어느 단계인가?"
            <br />
            예시 결과: 2.4 / 3 → 2단계와 3단계 사이이며 3단계에 더 가까움
          </div>
        </div>
      </div>
      <div className="summary-strip" style={{ marginTop: 14 }}>
        Noul은 맞나요?, Choice는 무엇인가요?, Score는 어느 정도인가요?를 판단합니다.
      </div>
    </div>
  );
}
