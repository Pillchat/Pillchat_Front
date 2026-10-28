import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const normal = (value) => JSON.parse(JSON.stringify(value));
const model = loader()("lib/learning/weakness.ts");
const filters = model.readWeaknessFilters({});
const question = (id, source, subject, rate, extra = {}) => ({
  id: source + ":" + id,
  questionId: id,
  source,
  subject,
  collectionRef: source + ":" + id,
  status: "WEAKNESS",
  confused: false,
  wrong: true,
  consecutiveCorrect: 0,
  totalAttempts: 10,
  wrongAttempts: rate / 10,
  wrongRate: rate,
  dueDate: "2026-10-27",
  lastPracticedAt: "2026-10-26T01:00:00Z",
  lastWrongAt: "2026-10-26T01:00:00Z",
  ...extra,
});
const library = {
  serverDate: "2026-10-28",
  questions: [
    question("1", "HANDCRAFTED", "약리학", 80),
    question("2", "AI", "임상약학", 90, {
      dueDate: "2026-10-28",
      lastWrongAt: "2026-10-27T01:00:00Z",
    }),
    question("3", "CBT", "약제학", 60),
    question("4", "CBT", "생약학", 20),
    question("5", "AI", "오늘 푼 문제", 100, {
      dueDate: "2026-10-29",
      lastPracticedAt: "2026-10-28T01:00:00Z",
    }),
    question("6", "CBT", "극복 분야", 100, {
      status: "MASTERED",
      dueDate: null,
      consecutiveCorrect: 2,
    }),
    question("7", "AI", "헷갈림 분야", 0, {
      wrong: false,
      confused: true,
      totalAttempts: 1,
      wrongAttempts: 0,
    }),
  ],
  collections: [
    {
      collectionRef: "HANDCRAFTED:1",
      source: "HANDCRAFTED",
      title: "약리학 수제 문제",
    },
    { collectionRef: "AI:2", source: "AI", title: "임상약학 AI 문제" },
    { collectionRef: "CBT:3", source: "CBT", title: "약제학 CBT" },
    { collectionRef: "CBT:4", source: "CBT", title: "생약학 CBT" },
    { collectionRef: "AI:7", source: "AI", title: "헷갈린 AI 문제" },
  ],
};

test("filters preserve one range and sort, multiple sources and an explicit empty selection", () => {
  const selected = model.readWeaknessFilters({
    range: "wrong",
    sources: "AI,CBT,AI,invalid",
    sort: "accuracy",
  });
  assert.deepEqual(normal(selected), {
    range: "wrong",
    sources: ["CBT", "AI"],
    sort: "accuracy",
  });
  const url = new URL(model.weaknessHref(selected), "https://app.example");
  assert.deepEqual(
    normal(model.readWeaknessFilters(Object.fromEntries(url.searchParams))),
    normal(selected),
  );
  assert.deepEqual(
    normal(model.readWeaknessFilters({ sources: "" }).sources),
    [],
  );
  assert.equal(model.weaknessCount(undefined, filters), null);
});

test("every range hides questions practiced today and mastered questions; wrong-only excludes confusion-only", () => {
  for (const range of ["all", "today", "wrong"]) {
    const questions = model.weaknessQuestions(library, { ...filters, range });
    assert.ok(
      !questions.some((q) => q.questionId === "5" || q.questionId === "6"),
    );
  }
  assert.equal(model.weaknessCount(library, { ...filters, range: "today" }), 5);
  assert.equal(model.weaknessCount(library, { ...filters, range: "wrong" }), 4);
  assert.equal(model.weaknessCount(library, { ...filters, sources: [] }), 0);
});

test("all three sorts use their real fields and source filters apply to both count and order", () => {
  const ids = (sort) =>
    normal(
      model
        .weaknessQuestions(library, { ...filters, sort })
        .map((q) => q.questionId),
    );
  assert.equal(ids("due").at(-1), "2");
  assert.deepEqual(ids("accuracy").slice(0, 3), ["2", "1", "3"]);
  assert.equal(ids("recent")[0], "2");
  assert.deepEqual(
    normal(
      model
        .weaknessQuestions(library, { ...filters, sources: ["HANDCRAFTED"] })
        .map((q) => q.questionId),
    ),
    ["1"],
  );
  const tie = question("8", "AI", "같은 날짜", 0, { lastWrongAt: null });
  assert.ok(
    Number.isFinite(
      model.compareWeakness("recent")(tie, { ...tie, id: "AI:9" }),
    ),
  );
});

test("subject weakness rates aggregate answer counts and keep only fields with unresolved weaknesses", () => {
  const data = {
    ...library,
    questions: [
      question("1", "AI", "같은 분야", 100, {
        totalAttempts: 1,
        wrongAttempts: 1,
      }),
      question("2", "AI", "같은 분야", 10, {
        status: "HISTORY",
        totalAttempts: 9,
        wrongAttempts: 1,
      }),
      question("3", "AI", "다른 분야", 70, {
        totalAttempts: 10,
        wrongAttempts: 7,
      }),
      question("4", "AI", "극복 분야", 100, { status: "MASTERED" }),
    ],
  };
  const fields = model.weaknessFields(data, filters);
  assert.deepEqual(normal(fields.map((f) => [f.subject, f.wrongRate])), [
    ["다른 분야", 70],
    ["같은 분야", 20],
  ]);
});

test("weakness API is read once and failures remain errors", async () => {
  const calls = [];
  const read = loader(
    {},
    {
      "@/lib/client/fetch": {
        fetchAPI: async (...args) => {
          calls.push(args);
          return library;
        },
      },
    },
  )("lib/client/weakness.ts").readWeaknessLibrary;
  assert.equal(await read(), library);
  assert.deepEqual(calls, [["/api/learning/weakness", "GET"]]);
  const failure = loader(
    {},
    {
      "@/lib/client/fetch": {
        fetchAPI: async () => {
          throw Error("offline");
        },
      },
    },
  )("lib/client/weakness.ts").readWeaknessLibrary;
  await assert.rejects(failure(), /offline/);
});

function nodes(element) {
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (!element || typeof element !== "object") return [];
  return [element, ...nodes(element.props?.children)];
}
function harness(file, props, data = library) {
  let index = 0;
  const slots = [],
    navigation = [],
    requests = [];
  const hooks = {
    ...React,
    useRef(initial) {
      const key = index++;
      if (!(key in slots)) slots[key] = { current: initial };
      return slots[key];
    },
    useState(initial) {
      const key = index++;
      if (!(key in slots))
        slots[key] = typeof initial === "function" ? initial() : initial;
      return [
        slots[key],
        (value) => {
          slots[key] = typeof value === "function" ? value(slots[key]) : value;
        },
      ];
    },
  };
  const wrap =
    (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  const Component = loader(
    {},
    {
      react: hooks,
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/public/icons/settings.svg": (props) =>
        React.createElement("svg", props),
      "@/components/ui/dialog": {
        Dialog: ({ open, children }) =>
          open ? React.createElement("div", null, children) : null,
        DialogContent: wrap("div"),
        DialogTitle: wrap("h2"),
        DialogDescription: wrap("p"),
      },
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
      "@/hooks/queries/useWeaknessQuery": {
        useWeaknessQuery: () => ({
          data,
          isLoading: false,
          isError: false,
          refetch() {},
        }),
      },
      "@/hooks/mutations/useStartWeaknessMutation": {
        useStartWeaknessMutation: () => ({
          isPending: false,
          isError: false,
          mutate(request, options) {
            requests.push(request);
            options?.onSuccess({
              engine: "LEGACY_AI",
              result: { sessionId: "501" },
            });
          },
        }),
      },
    },
  )(file).default;
  return {
    navigation,
    requests,
    render() {
      index = 0;
      return Component(props);
    },
  };
}

test("main shows only the three highest subject rates and classification belongs to the shortcut section", () => {
  const h = harness(
    "app/(learn)/learning/weakness/_components/WeaknessMain.tsx",
    { filters },
  );
  const tree = h.render();
  const ranking = nodes(tree).find(
    (n) => n.props?.["aria-label"] === "오답률 상위 3개 분야",
  );
  const rankHtml = renderToStaticMarkup(ranking);
  assert.ok(rankHtml.indexOf("오늘 푼 문제") < rankHtml.indexOf("임상약학"));
  assert.ok(rankHtml.indexOf("임상약학") < rankHtml.indexOf("약리학"));
  assert.ok(!rankHtml.includes("생약학"));
  const settingsLink = nodes(tree).find(
    (n) => n.props?.["aria-label"] === "나의 약점 분야 설정",
  );
  assert.match(settingsLink.props.href, /\/weakness\/areas\?/);
  assert.equal(
    renderToStaticMarkup(settingsLink)
      .replace(/<[^>]+>/g, "")
      .trim(),
    "",
  );
  assert.ok(!nodes(settingsLink).includes(ranking));

  const section = nodes(tree).find(
    (n) => n.props?.["aria-labelledby"] === "weakness-practice-title",
  );
  assert.ok(
    renderToStaticMarkup(section).includes("/weakness/classification?"),
  );
  nodes(tree)
    .find((n) => n.props?.id === "weakness-tab-subjects")
    .props.onClick();
  assert.ok(renderToStaticMarkup(h.render()).includes("약리학"));
});

test("a collection starts the selected range, source and sort instead of opening an unfiltered library", () => {
  const selected = {
    ...filters,
    sort: "accuracy",
    range: "wrong",
    sources: ["AI"],
  };
  const h = harness(
    "app/(learn)/learning/weakness/_components/WeaknessMain.tsx",
    { filters: selected },
  );
  nodes(h.render())
    .find((n) => n.type === "button" && n.key === "AI:2")
    .props.onClick();
  assert.equal(h.requests[0].source, "AI");
  assert.equal(h.requests[0].collectionRef, "AI:2");
  assert.equal(h.requests[0].range, "wrong");
  assert.equal(h.requests[0].sort, "accuracy");
  assert.match(h.requests[0].idempotencyKey, /^[0-9a-f-]{36}$/);
  assert.deepEqual(h.navigation, ["/learning/ai?session=501"]);
});

test("settings keep single choices and multiple sources, display today's count and return to main", () => {
  const h = harness(
    "app/(learn)/learning/weakness/_components/WeaknessSettings.tsx",
    { initialFilters: filters },
  );
  let tree = h.render();
  nodes(tree)
    .find((n) => n.type === "input" && n.props.value === "wrong")
    .props.onChange();
  nodes(h.render())
    .find((n) => n.type === "input" && n.props.value === "CBT")
    .props.onChange();
  nodes(h.render())
    .find((n) => n.type === "input" && n.props.value === "recent")
    .props.onChange();
  tree = h.render();
  assert.equal(
    nodes(tree).filter(
      (n) =>
        n.type === "input" &&
        n.props.name === "weakness-range" &&
        n.props.checked,
    ).length,
    1,
  );
  const footer = nodes(tree).find((n) => n.type === "footer");
  assert.ok(footer.props.className.includes("fixed"));
  nodes(footer)
    .find((n) => n.props?.onClick)
    .props.onClick();
  const url = new URL(h.navigation[0], "https://app.example");
  assert.equal(url.pathname, "/learning/weakness");
  assert.equal(url.searchParams.get("sources"), "HANDCRAFTED,AI");
  assert.equal(url.searchParams.get("sort"), "recent");
});

test("classification has the requested title and all five rules; mastered questions have a separate list", async () => {
  const load = loader(
    {},
    {
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/public/icons/settings.svg": (props) =>
        React.createElement("svg", props),
      "@/lib/navigation": { useRouter: () => ({ push() {} }) },
    },
  );
  const Page = load(
    "app/(learn)/learning/weakness/classification/page.tsx",
  ).default;
  const html = renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve({}) }),
  );
  for (const text of [
    "학습 분류 기준",
    "미풀이 문제",
    "문제 풀기",
    "맞힌 문제",
    "전체 학습 기록",
    "틀린 문제",
    "헷갈림 표시",
    "2회 연속 정답",
    "극복한 문제",
  ])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes("추후 연결"));
  const h = harness(
    "app/(learn)/learning/weakness/_components/MasteredQuestions.tsx",
    { filters },
  );
  const mastered = renderToStaticMarkup(h.render());
  assert.ok(mastered.includes("극복 분야"));
  assert.ok(!mastered.includes("약리학"));
});

test("confusion control stores an explicit state and retries with the identical command key", () => {
  const sent = [];
  const mutation = {
    isPending: false,
    isError: false,
    mutate: (value) => sent.push(value),
  };
  const load = loader(
    {},
    {
      "@/hooks/queries/useQuestionConfusionQuery": {
        useQuestionConfusionQuery: () => ({
          data: { confused: false },
          isError: false,
        }),
      },
      "@/hooks/mutations/useQuestionConfusionMutation": {
        useQuestionConfusionMutation: () => mutation,
      },
    },
  );
  const Toggle = load(
    "components/learning/ConfusionToggle.tsx",
  ).ConfusionToggle;
  const shell = Toggle({ source: "AI", questionId: "7" });
  let tree = shell.type(shell.props);
  nodes(tree)
    .find((n) => n.type === "input")
    .props.onChange({ target: { checked: true } });
  assert.equal(sent[0].confused, true);
  mutation.isError = true;
  mutation.variables = sent[0];
  tree = shell.type(shell.props);
  assert.equal(
    nodes(tree).find((n) => n.type === "input").props.disabled,
    true,
  );
  nodes(tree)
    .find((n) => n.type === "button")
    .props.onClick();
  assert.equal(sent[0], sent[1]);
});
