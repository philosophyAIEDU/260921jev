import { useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: '"이 문의는 긴급한가?"에는 어떤 유형이 적합한가?',
    options: ["Noul", "Choice", "Score"],
    correctIndex: 0,
    explanation: "Yes 또는 No로 답할 수 있는 질문이므로 Noul이 적합합니다.",
  },
  {
    question: '"배송, 결제, 환불 중 무엇인가?"에는 어떤 유형이 적합한가?',
    options: ["Noul", "Choice", "Score"],
    correctIndex: 1,
    explanation: "순서 없는 여러 항목 중 하나를 고르는 질문이므로 Choice가 적합합니다.",
  },
  {
    question: '"문제의 심각도는 어느 단계인가?"에는 어떤 유형이 적합한가?',
    options: ["Noul", "Choice", "Score"],
    correctIndex: 2,
    explanation: "순서가 있는 단계를 평가하는 질문이므로 Score가 적합합니다.",
  },
  {
    question: "Noul 값 0.8은 무엇을 뜻하는가?",
    options: [
      "심각도가 80점이라는 뜻",
      "질문에 Yes라고 답할 가능성이 약 80%라는 뜻",
      "정확도가 80%라는 뜻",
    ],
    correctIndex: 1,
    explanation: "Noul 값은 Yes일 확률입니다. 100점 만점 점수가 아닙니다.",
  },
  {
    question: "confidence 1.0이면 항상 정답인가?",
    options: [
      "그렇다. confidence가 1.0이면 반드시 맞는 결과다.",
      "아니다. 확률 분포가 한 결과에 집중되었다는 뜻이며 현실의 정답을 보장하지 않는다.",
    ],
    correctIndex: 1,
    explanation:
      "confidence는 모델이 얼마나 하나의 답에 확신을 두는지를 나타낼 뿐, 실제 정답 여부를 보장하지 않습니다.",
  },
];

export function QuizSection() {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function select(qIndex: number, optionIndex: number) {
    setAnswers((s) => ({ ...s, [qIndex]: optionIndex }));
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="card">
      <h2 className="card-title">학습 확인 퀴즈</h2>
      <p className="card-subtitle">
        점수는 저장되지 않습니다. 스스로 이해도를 확인해 보는 용도입니다. ({answeredCount}/
        {QUESTIONS.length}문항 응답)
      </p>
      {QUESTIONS.map((q, qi) => {
        const selected = answers[qi];
        return (
          <div className="quiz-question" key={qi}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>
              {qi + 1}. {q.question}
            </div>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                let cls = "quiz-option";
                if (selected !== undefined) {
                  if (oi === q.correctIndex) cls += " is-correct";
                  else if (oi === selected) cls += " is-wrong";
                } else if (selected === oi) {
                  cls += " is-selected";
                }
                return (
                  <button key={oi} type="button" className={cls} onClick={() => select(qi, oi)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected !== undefined && (
              <div className="explain-callout" style={{ marginTop: 8 }}>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
