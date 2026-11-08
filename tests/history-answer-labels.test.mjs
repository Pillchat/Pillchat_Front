import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const { historyAnswerLabel } = loader()("lib/learning/answer-labels.ts");
const choices = ["B", "E", "D", "C", "A"].map((id) => ({
  id,
  text: `선택지 ${id}`,
  explanation: null,
}));

test("answer labels follow displayed choice order rather than alphabetical IDs", () => {
  assert.equal(historyAnswerLabel(choices, "E"), "2번");
  assert.equal(historyAnswerLabel(choices, "C"), "4번");
  assert.equal(historyAnswerLabel([{ id: "opaque-id" }], "opaque-id"), "1번");
  assert.deepEqual(
    choices.map((choice) => choice.id),
    ["B", "E", "D", "C", "A"],
  );
});

test("unanswered and text answers stay distinct from unavailable choice IDs", () => {
  assert.equal(historyAnswerLabel(choices, null), null);
  assert.equal(historyAnswerLabel(choices, ""), null);
  assert.equal(historyAnswerLabel([], "주관식 답안"), "주관식 답안");
  assert.equal(historyAnswerLabel(choices, "missing"), "확인할 수 없음");
});

test("history detail uses the same numeric labels in options and its answer summary", () => {
  const Page = loader(
    {},
    {
      react: {
        ...React,
        use: () => ({ source: "HANDCRAFTED", id: "attempt-1" }),
      },
      "next/navigation": { useSearchParams: () => new URLSearchParams() },
      "@/components/molecules/PracticeHeader": { PracticeHeader: () => null },
      "@/components/ui/button": {
        Button: ({ variant, ...props }) => React.createElement("button", props),
      },
      "@/components/learning/ConfusionToggle": { ConfusionToggle: () => null },
      "@/hooks/queries/useLearningHistory": {
        useLearningHistoryDetail: () => ({
          data: {
            attempt: { title: "생화학", questionCount: 1, correctCount: 0 },
            questions: [
              {
                questionId: "question-1",
                content: "질문",
                choices,
                outcome: "INCORRECT",
                userAnswer: "E",
                correctAnswer: "C",
                explanation: "해설",
              },
            ],
          },
        }),
      },
    },
  )("app/(learn)/learning/history/[source]/[id]/page.tsx").default;
  const html = renderToStaticMarkup(
    React.createElement(Page, { params: Promise.resolve({}) }),
  );
  assert.match(html, /2\. 선택지 E \(내 답안\)/);
  assert.match(html, /내 답안: 2번 · 정답: 4번/);
  assert.doesNotMatch(html, /내 답안: E|정답: C/);
});
