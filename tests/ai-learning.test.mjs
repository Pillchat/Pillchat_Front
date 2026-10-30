import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const common = {
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "next/link": ({ children, href, ...props }) =>
    React.createElement("a", { ...props, href }, children),
  "@/components/molecules": {
    CustomHeader: ({ title }) => React.createElement("header", null, title),
  },
  "@/components/atoms": {
    SolidButton: ({ content, onClick, disabled }) =>
      React.createElement("button", { onClick, disabled }, content),
  },
  "@/components/learning/ConfusionToggle": { ConfusionToggle: () => null },
  "./ConfusionToggle": { ConfusionToggle: () => null },
  "@/components/learning/WeaknessReviewFeedback": () => null,
  "@/hooks/queries/useWeaknessQuery": {
    useWeaknessQuery: () => ({
      data: { questions: [{ source: "AI", questionId: "2", confused: true }] },
      isPending: false,
      isError: false,
    }),
  },
};
test("AI results reuse scores, include confusion and weak topics, and route to weakness or fresh generation", () => {
  const View = loader(
    {},
    common,
  )("components/learning/AiPracticeResult.tsx").default;
  const result = {
    type: "PDF",
    questionCount: 2,
    correctCount: 1,
    scorePercent: 50,
    answers: [
      {
        questionId: 1,
        subject: "약리학",
        content: "첫 문제",
        isCorrect: false,
        correctAnswer: "A",
        explanation: "해설",
        userAnswer: "B",
      },
      {
        questionId: 2,
        subject: "약제학",
        content: "둘째 문제",
        isCorrect: true,
        correctAnswer: "A",
        explanation: "해설",
        userAnswer: "A",
      },
    ],
  };
  const html = renderToStaticMarkup(React.createElement(View, { result }));
  for (const text of [
    "총 문제",
    "정답",
    "오답",
    "헷갈림 표시",
    "약리학",
    "약제학",
    "/learning/weakness",
    "/questionbank/generate",
    "문제별 해설",
  ])
    assert.ok(html.includes(text), text);
  assert.equal(html.includes("이번 학습에서 확인된 약점이 없어요"), false);
});

const nodes = (tree) =>
  Array.isArray(tree)
    ? tree.flatMap(nodes)
    : tree && typeof tree === "object"
      ? [tree, ...nodes(tree.props?.children)]
      : [];
test("AI recovery selects the first unanswered question and renders server grading with existing choice component", async () => {
  let cursor = 0;
  const values = [];
  const effects = [];
  const calls = [];
  const fakeReact = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = initial;
      return [
        values[i],
        (value) => {
          values[i] = typeof value === "function" ? value(values[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = { current: initial };
      return values[i];
    },
    useEffect(effect) {
      effects.push(effect);
    },
  };
  const quiz = {
    sessionId: "7",
    status: "IN_PROGRESS",
    type: "PREMIUM",
    questions: [
      {
        questionId: "1",
        type: "MULTIPLE_CHOICE",
        subject: "약리학",
        content: "첫 문제",
        choices: ["A", "B"],
      },
      {
        questionId: "2",
        type: "TRUE_FALSE",
        subject: "약리학",
        content: "둘째 문제",
        choices: null,
      },
    ],
    answers: [
      {
        questionId: "1",
        action: "ANSWER",
        isCorrect: true,
        userAnswer: "A",
        correctAnswer: "A",
      },
    ],
  };
  const fetchAPI = async (url, method, body) => {
    calls.push({ url, method, body });
    if (method === "POST") {
      quiz.answers.push({
        questionId: "2",
        action: "ANSWER",
        isCorrect: false,
        userAnswer: "X",
        correctAnswer: "O",
        explanation: "서버 해설",
      });
      return {};
    }
    return structuredClone(quiz);
  };
  const View = loader(
    { window: { location: { search: "?session=7" } } },
    {
      ...common,
      react: fakeReact,
      "@/lib/client/fetch": { fetchAPI, ApiError: class extends Error {} },
    },
  )("app/(learn)/learning/ai/page.tsx").default;
  const render = () => {
    cursor = 0;
    return View();
  };
  render();
  effects[0]();
  await new Promise(setImmediate);
  let tree = render();
  assert.ok(
    nodes(tree).some(
      (n) => n.type === "h1" && n.props.children === "둘째 문제",
    ),
  );
  const choice = nodes(tree).find((n) => n.props?.choice?.text === "X");
  assert.ok(choice);
  choice.props.onClick();
  tree = render();
  nodes(tree)
    .find((n) => n.props?.content === "채점하기")
    .props.onClick();
  await new Promise(setImmediate);
  tree = render();
  const explanation = nodes(tree).find(
    (n) => n.props?.explanation === "서버 해설",
  );
  assert.equal(explanation.props.correct, false);
  assert.equal(calls.find((c) => c.method === "POST").body.userAnswer, "X");
  assert.ok(calls.find((c) => c.method === "POST").body.idempotencyKey);
});
