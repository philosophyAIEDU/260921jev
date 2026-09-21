import { useState } from "react";
import { JEV_QUESTION_SET, QUESTION_EXPLAINERS } from "../../lib/api/jevQuestions";
import type { JevQuestionSet } from "../../types/jev";
import { ChoiceIcon, NoulIcon, ScoreIcon } from "../../components/icons";

const TYPE_ICON = { noul: NoulIcon, choice: ChoiceIcon, score: ScoreIcon };
const TYPE_BADGE_CLASS = { noul: "badge-noul", choice: "badge-choice", score: "badge-score" };
const TYPE_LABEL = { noul: "Noul", choice: "Choice", score: "Score" };

export function QuestionDesignCards() {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ category: true });

  function toggle(key: string) {
    setOpenKeys((s) => ({ ...s, [key]: !s[key] }));
  }

  const keys = Object.keys(JEV_QUESTION_SET) as (keyof JevQuestionSet)[];

  return (
    <div className="card">
      <h2 className="card-title">Jev에 보낼 질문 설계</h2>
      <p className="card-subtitle">
        분석을 시작하기 전에 Jev에게 어떤 질문을 하는지, 왜 그 유형을 선택했는지 먼저 확인해
        보세요.
      </p>
      {keys.map((key) => {
        const q = JEV_QUESTION_SET[key];
        const explainer = QUESTION_EXPLAINERS.find((e) => e.key === key)!;
        const Icon = TYPE_ICON[q.type];
        const isOpen = !!openKeys[key];
        return (
          <div className="question-card" key={key}>
            <div className="question-card__header" onClick={() => toggle(key)}>
              <Icon />
              <span className={`badge ${TYPE_BADGE_CLASS[q.type]}`}>{TYPE_LABEL[q.type]}</span>
              <span className="question-card__title">{q.instructions}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {isOpen ? "접기" : "펼치기"}
              </span>
            </div>
            {isOpen && (
              <div className="question-card__body">
                <div>
                  <strong>질문 이름:</strong> {key}
                </div>
                <div>
                  <strong>선택 이유:</strong> {explainer.reason}
                </div>
                <div>
                  <strong>예상 결과 형태:</strong> {explainer.resultShape}
                </div>
                {"criteria" in q && q.criteria && (
                  <div className="question-card__criteria">
                    <strong>criteria</strong>
                    {Array.isArray(q.criteria)
                      ? q.criteria.map((c, i) => (
                          <div className="question-card__criteria-item" key={i}>
                            <b>단계 {i}</b> <span>{c}</span>
                          </div>
                        ))
                      : Object.entries(q.criteria).map(([k, v]) => (
                          <div className="question-card__criteria-item" key={k}>
                            <b>{k}</b> <span>{v}</span>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
