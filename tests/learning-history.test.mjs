import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";
const model = loader()("lib/learning/history.ts");
const entry = {
  attemptId: "9007199254740997",
  source: "HANDCRAFTED",
  title: "약물학 세트",
  subject: "약물학",
  topic: "고혈압",
  state: "COMPLETED",
  questionCount: 4,
  answeredCount: 4,
  correctCount: 3,
  wrongCount: 1,
  confusedCount: 1,
};
test("history preserves opaque identifiers and only resumes ongoing attempts", () => {
  assert.equal(
    model.historyHref(entry),
    "/learning/history/HANDCRAFTED/9007199254740997",
  );
  assert.equal(
    model.historyHref({ ...entry, source: "AI", state: "IN_PROGRESS" }),
    "/learning/ai?session=9007199254740997",
  );
  assert.equal(model.historyAccuracy(entry), 75);
  assert.equal(model.historyAccuracy({ ...entry, correctCount: null }), null);
  assert.equal(
    model.historyAccuracy({ ...entry, questionCount: 0, correctCount: 0 }),
    0,
  );
});
test("history queries isolate accounts and filters and forward opaque cursors", async () => {
  let options;
  const calls = [];
  const load = loader(
    {},
    {
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => "user-7" },
      "@tanstack/react-query": {
        useInfiniteQuery: (o) => (options = o),
        useQuery: (o) => (options = o),
      },
      "@/lib/client/fetch": {
        fetchAPI: (...args) => {
          calls.push(args);
          return Promise.resolve({});
        },
      },
    },
  );
  const hooks = load("hooks/queries/useLearningHistory.ts");
  hooks.useLearningHistory("wrong", 2);
  assert.deepEqual(Array.from(options.queryKey), [
    "learning-history",
    "user-7",
    "wrong",
    2,
  ]);
  await options.queryFn({ pageParam: "opaque-cursor" });
  assert.equal(calls[0][2].cursor, "opaque-cursor");
  assert.equal(options.getNextPageParam({ nextCursor: null }), undefined);
  hooks.useLearningHistoryDetail("AI", "id/with/slash", "confused");
  await options.queryFn();
  assert.equal(calls[1][0], "/api/learning/history/AI/id%2Fwith%2Fslash");
});
test("history return links retain the actual list and filter without allowing another destination", () => {
  for (const view of ["recent", "all"]) {
    for (const filter of ["all", "correct", "wrong", "confused"]) {
      const origin = model.historyListHref(view, filter);
      const detail = model.historyHref(entry, origin);
      assert.equal(
        model.historyReturnHref(
          new URL(detail, "https://pillchat.local").searchParams.get(
            "returnTo",
          ),
        ),
        origin,
      );
    }
  }
  assert.equal(model.historyReturnHref("/questionbank"), "/questionbank");
  for (const unsafe of [
    "https://evil.example/learning/recent",
    "//evil.example",
    "/\\evil.example",
    "/login",
    "/learning/history/AI/1",
    "javascript:alert(1)",
  ])
    assert.equal(model.historyReturnHref(unsafe), "/learning/history");
  assert.equal(
    model.historyReturnHref(
      "/learning/recent?filter=unknown&next=https://evil.example",
    ),
    "/learning/recent",
  );
});
const overrides = {
  "next/navigation": { useSearchParams: () => new URLSearchParams() },
  "@/components/molecules/PracticeHeader": {
    PracticeHeader: ({ title }) => React.createElement("h1", null, title),
  },
  "@/components/ui/button": {
    Button: ({ variant, ...props }) => React.createElement("button", props),
  },
  "@/public/icons/question-bank.svg": () => null,
  "@/lib/navigation": { useRouter: () => ({ push() {} }) },
  "next/link": ({ href, children }) =>
    React.createElement("a", { href }, children),
  "@/components/learning/ConfusionToggle": { ConfusionToggle: () => null },
  "@/components/learning/LearningSourceIcon": () => null,
  "@/hooks/useLearningHistoryPosition": {
    useLearningHistoryPosition: () => () => {},
  },
};
test("history metrics distinguish progress from accuracy and show unknown accuracy without a bar", () => {
  const Card = loader(
    {},
    overrides,
  )("components/learning/HistoryAttemptCard.tsx").default;
  const render = (changes) =>
    renderToStaticMarkup(
      React.createElement(Card, { entry: { ...entry, ...changes } }),
    );
  const ongoing = render({ state: "IN_PROGRESS", answeredCount: 2 });
  assert.match(ongoing, /진행률<\/span><strong[^>]*>50%/);
  assert.match(ongoing, /응답 2\/4문제/);
  assert.match(render({}), /정답률<\/span><strong[^>]*>75%/);
  const unknown = render({ correctCount: null });
  assert.match(unknown, /정답률<\/span><strong[^>]*>–/);
  assert.doesNotMatch(unknown, /<progress|null%/);
  assert.doesNotMatch(ongoing, /<progress/);
});
test("automatic source-only titles omit the duplicate source description while subject titles retain it", () => {
  const label = loader()("lib/learning/attemptLabels.ts").learningSourceLabel;
  assert.equal(label("AI", "AI 문제 풀이"), null);
  assert.equal(label("AI", "AI 생성 문제"), null);
  assert.equal(label("AI", "2026.11.05 약리학 - 1"), "AI 생성 문제");
  assert.equal(label("HANDCRAFTED", "약리학 수제 문제"), "수제 제작 문제");
  assert.equal(label("CBT", "약사고시 1교시 모의고사 1회"), "CBT");
});
test("list filters are URL-backed and its detail links carry the same origin", () => {
  const replacements = [];
  let selected;
  const View = loader(
    {},
    {
      ...overrides,
      "next/navigation": {
        useSearchParams: () => new URLSearchParams("filter=wrong"),
      },
      "@/lib/navigation": {
        useRouter: () => ({ replace: (...args) => replacements.push(args) }),
      },
      "@/hooks/queries/useLearningHistory": {
        useLearningHistory: (filter) => {
          selected = filter;
          return { data: { pages: [{ items: [entry] }] } };
        },
      },
    },
  )("components/learning/LearningHistoryPage.tsx").default;
  const tree = View({ view: "recent" });
  const nodes = (value) =>
    Array.isArray(value)
      ? value.flatMap(nodes)
      : value && typeof value === "object"
        ? [value, ...nodes(value.props?.children)]
        : [];
  assert.equal(selected, "wrong");
  assert.equal(
    nodes(tree).find((node) => node.props?.entry)?.props.returnTo,
    "/learning/recent?filter=wrong",
  );
  nodes(tree)
    .find((node) => node.props?.children === "맞음")
    .props.onClick();
  assert.equal(replacements.length, 1);
  assert.equal(replacements[0][0], "/learning/recent?filter=correct");
  assert.equal(replacements[0][1].scroll, false);
});
test("recent learning renders only two sets and distinguishes empty, loading and failure", () => {
  for (const [query, expected] of [
    [{ isPending: true }, /불러오는 중/],
    [{ isError: true }, /다시 시도/],
    [{ data: { pages: [{ items: [] }] } }, /아직 학습 기록이 없어요/],
    [
      {
        data: {
          pages: [
            {
              items: [
                entry,
                { ...entry, attemptId: "2", title: "두 번째" },
                { ...entry, attemptId: "3", title: "세 번째" },
              ],
            },
          ],
        },
      },
      /두 번째/,
    ],
  ]) {
    const load = loader(
      {},
      {
        ...overrides,
        "@/hooks/queries/useLearningHistory": {
          useLearningHistory: () => query,
        },
      },
    );
    const View = load("components/learning/RecentLearning.tsx").default;
    const html = renderToStaticMarkup(React.createElement(View));
    assert.match(html, expected);
    assert.doesNotMatch(html, /세 번째/);
  }
});
test("detail renders selected answers, case text, individual and full explanations", () => {
  const load = loader(
    {},
    {
      ...overrides,
      react: {
        ...React,
        use: () => ({ source: "HANDCRAFTED", id: entry.attemptId }),
      },
      "@/hooks/queries/useLearningHistory": {
        useLearningHistoryDetail: () => ({
          data: {
            attempt: entry,
            questions: [
              {
                questionId: "question-1",
                subject: "약물학",
                topic: "고혈압",
                content: "사례 질문",
                referenceContent: "환자 사례 본문",
                choices: [
                  { id: "A", text: "선택지 A", explanation: "선지별 근거" },
                ],
                userAnswer: "A",
                correctAnswer: "A",
                explanation: "전체 근거",
                outcome: "CORRECT",
                confused: true,
              },
            ],
          },
        }),
      },
    },
  );
  const View = load(
    "app/(learn)/learning/history/[source]/[id]/page.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(View, { params: Promise.resolve({}) }),
  );
  for (const text of [
    "환자 사례 본문",
    "선지별 근거",
    "전체 근거",
    "내 답안",
    "헷갈림",
    "75%",
  ])
    assert.ok(html.includes(text));
});
test("detail header goes back to its recent or full-history list with the original filter", () => {
  for (const returnTo of [
    "/learning/recent?filter=wrong",
    "/learning/history?filter=confused",
    "/questionbank",
  ]) {
    const View = loader(
      {},
      {
        ...overrides,
        react: { ...React, use: () => ({ source: "AI", id: "1" }) },
        "next/navigation": {
          useSearchParams: () => new URLSearchParams({ returnTo }),
        },
        "@/components/molecules/PracticeHeader": {
          PracticeHeader: ({ backHref }) =>
            React.createElement("a", { href: backHref }, "목록으로"),
        },
        "@/hooks/queries/useLearningHistory": {
          useLearningHistoryDetail: () => ({}),
        },
      },
    )("app/(learn)/learning/history/[source]/[id]/page.tsx").default;
    const html = renderToStaticMarkup(
      React.createElement(View, { params: Promise.resolve({}) }),
    );
    assert.ok(html.includes(`href="${returnTo}"`));
  }
});
