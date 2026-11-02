import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";
const mocks = {
  "next/link": ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children),
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "@/components/molecules": {
    AppShell: ({ children }) => children,
    PracticeHeader: () => null,
    CustomHeader: () => null,
  },
  "@/components/learning/TutorialButton": { TutorialButton: () => null },
  "@/components/learning/WeaknessReviewFeedback": () => null,
  "@/components/learning/ConfusionToggle": { ConfusionToggle: () => null },
  "./ConfusionToggle": { ConfusionToggle: () => null },
};
test("regular result actions only navigate to source-filtered wrong questions and the practice hub", () => {
  const View = loader(
    {},
    mocks,
  )("components/learning/ResultActions.tsx").default;
  for (const source of ["AI", "CBT", "HANDCRAFTED"]) {
    const html = renderToStaticMarkup(
      React.createElement(View, { review: false, source }),
    );
    assert.match(html, /오답 복습하기/);
    assert.match(html, /문제 풀기로 돌아가기/);
    assert.ok(html.includes(`range=wrong&amp;sources=${source}`));
    assert.equal((html.match(/<a /g) || []).length, 2);
  }
});
test("weakness results require a mastered question before enabling the archive", () => {
  for (const source of ["AI", "HANDCRAFTED", "CBT"])
    for (const state of ["empty", "pending", "failed", "mastered"]) {
      const data =
        state === "pending"
          ? undefined
          : {
              questions:
                state === "mastered" || state === "failed"
                  ? [{ status: "MASTERED" }]
                  : [],
            };
      const load = loader(
        {},
        {
          ...mocks,
          "@/hooks/queries/useWeaknessQuery": {
            useWeaknessQuery: () => ({
              data,
              isError: state === "failed",
              isPending: state === "pending",
            }),
          },
        },
      );
      let element;
      if (source === "AI") {
        const View = load("components/learning/AiPracticeResult.tsx").default;
        element = React.createElement(View, {
          result: {
            type: "REVIEW",
            scorePercent: 100,
            questionCount: 0,
            correctCount: 0,
            answers: [],
          },
        });
      } else {
        const { PracticeResult } = load(
          "components/learning/practice/PracticeResult.tsx",
        );
        element = React.createElement(PracticeResult, {
          session: {
            source,
            attempt: { mode: "REVIEW" },
            result: {
              score: 100,
              counts: { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
              questions: [],
            },
          },
          onTutorial() {},
        });
      }
      const html = renderToStaticMarkup(element);
      assert.match(html, /극복한 문제 보기/);
      assert.match(html, /약점공략 홈으로/);
      assert.equal(
        html.includes('href="/learning/weakness/mastered"'),
        state === "mastered",
      );
      assert.equal(html.includes('disabled=""'), state !== "mastered");
      assert.doesNotMatch(
        html,
        /새 문제 생성하기|같은 조건으로|문제 풀기로 돌아가기|학습 기록에서 다시 복습하기/,
      );
    }
});
