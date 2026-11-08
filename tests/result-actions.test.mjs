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
const nodes = (tree) =>
  Array.isArray(tree)
    ? tree.flatMap(nodes)
    : tree && typeof tree === "object"
      ? [tree, ...nodes(tree.props?.children)]
      : [];
test("regular results open this set's explanations and keep all weaknesses separate", () => {
  const View = loader(
    {},
    mocks,
  )("components/learning/ResultActions.tsx").default;
  let reviewed = 0;
  const tree = View({
    review: false,
    wrongCount: 2,
    onReviewWrong: () => reviewed++,
  });
  nodes(tree)
    .find((node) => node.type === "button")
    .props.onClick();
  assert.equal(reviewed, 1);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /이번 세트 오답 해설/);
  assert.match(html, /href="\/learning\/weakness"[^>]*>전체 약점공략/);
  assert.doesNotMatch(html, /range=wrong|sources=|오답 복습하기/);
});
test("perfect results put a new practice first instead of an empty wrong-review action", () => {
  const View = loader(
    {},
    mocks,
  )("components/learning/ResultActions.tsx").default;
  const html = renderToStaticMarkup(
    React.createElement(View, { review: false, wrongCount: 0 }),
  );
  assert.match(html, /href="\/questionbank"/);
  assert.ok(html.indexOf("새 문제 풀기") < html.indexOf("전체 약점공략"));
  assert.doesNotMatch(html, /이번 세트 오답 해설/);
});
test("this-set review opens only wrong explanations for AI, handcrafted and CBT results", () => {
  for (const source of ["AI", "HANDCRAFTED", "CBT"]) {
    let cursor = 0,
      scrolled = 0,
      committedOpen = false;
    const slots = [];
    const effects = [];
    const hooks = {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [
          slots[index],
          (value) => {
            slots[index] =
              typeof value === "function" ? value(slots[index]) : value;
          },
        ];
      },
      useRef() {
        const index = cursor++;
        return (
          slots[index] ??
          (slots[index] = {
            current: {
              scrollIntoView: () => {
                assert.equal(
                  committedOpen,
                  true,
                  "scroll must wait until expanded explanations commit",
                );
                scrolled++;
              },
            },
          })
        );
      },
      useEffect(effect) {
        effects.push(effect);
      },
    };
    const load = loader(
      {},
      {
        ...mocks,
        react: hooks,
        "@/hooks/queries/useWeaknessQuery": {
          useWeaknessQuery: () => ({ data: { questions: [] } }),
        },
      },
    );
    let render;
    if (source === "AI") {
      const View = load("components/learning/AiPracticeResult.tsx").default;
      const result = {
        type: "AI",
        questionCount: 2,
        correctCount: 1,
        scorePercent: 50,
        answers: [false, true].map((isCorrect, index) => ({
          questionId: index,
          subject: "생물학",
          content: isCorrect ? "맞힌 문항" : "틀린 문항",
          isCorrect,
          userAnswer: "B",
          correctAnswer: "A",
          explanation: isCorrect ? "정답 해설" : "이번 세트 오답 근거",
          choices: [],
        })),
      };
      render = () => {
        cursor = 0;
        return View({ result });
      };
    } else {
      const { PracticeResult } = load(
        "components/learning/practice/PracticeResult.tsx",
      );
      const session = {
        source,
        attempt: { mode: "FULL" },
        result: {
          score: 50,
          counts: { total: 2, correct: 1, incorrect: 1, unanswered: 0 },
          questions: [false, true].map((correct, index) => ({
            question: {
              attemptQuestionId: String(index),
              sourceQuestionVersionId: String(index),
              subjectName: "생물학",
              stem: correct ? "맞힌 문항" : "틀린 문항",
              choices: [],
            },
            answer: { selectedChoiceId: "B" },
            grade: {
              outcome: correct ? "CORRECT" : "INCORRECT",
              correctChoiceId: "A",
              explanation: correct ? "정답 해설" : "이번 세트 오답 근거",
            },
          })),
        },
      };
      render = () => {
        cursor = 0;
        return PracticeResult({ session, onTutorial() {} });
      };
    }
    const initial = render();
    const action = nodes(initial).find((node) => node.props?.onReviewWrong);
    assert.equal(action.props.wrongCount, 1);
    action.props.onReviewWrong();
    assert.equal(scrolled, 0, "click must not scroll the collapsed old layout");
    const reviewed = render();
    const html = renderToStaticMarkup(reviewed);
    assert.ok(html.includes("이번 세트 오답 근거"), source);
    assert.ok(!html.includes("맞힌 문항"), source);
    committedOpen = nodes(reviewed).some(
      (node) => node.type === "details" && node.props.open === true,
    );
    assert.ok(committedOpen, source);
    effects.splice(0).forEach((effect) => effect());
    assert.equal(scrolled, 1);
    nodes(reviewed)
      .find((node) => node.props?.onReviewWrong)
      .props.onReviewWrong();
    render();
    effects.splice(0).forEach((effect) => effect());
    assert.equal(
      scrolled,
      2,
      "repeated review action still scrolls after committing",
    );
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
