import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const normal = (value) => JSON.parse(JSON.stringify(value));
const model = loader()("lib/learning/weakness.ts");
const filters = model.readWeaknessFilters({});
const library = {
  questions: [
    {
      id: "HANDCRAFTED:1",
      source: "HANDCRAFTED",
      subject: "약리학",
      collectionRef: "hc:1",
    },
    { id: "AI:1", source: "AI", subject: "임상약학", collectionRef: "ai:1" },
  ],
  collections: [
    { collectionRef: "hc:1", source: "HANDCRAFTED", title: "약리학 수제 문제" },
    { collectionRef: "ai:1", source: "AI", title: "임상약학 AI 문제" },
  ],
};

test("weakness filters round trip single choices and multiple sources, including no source", () => {
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
  assert.equal(url.pathname, "/learning/weakness");
  assert.deepEqual(
    normal(model.readWeaknessFilters(Object.fromEntries(url.searchParams))),
    normal(selected),
  );
  assert.deepEqual(
    normal(model.readWeaknessFilters({ sources: "" }).sources),
    [],
  );
  assert.equal(
    model.weaknessCount(library, { ...filters, range: "today" }),
    null,
  );
  assert.equal(model.weaknessCount(undefined, filters), null);
  assert.equal(model.weaknessCount(library, { ...filters, sources: [] }), 0);
});

test("existing review records are paginated and deduplicated without counting correct or unavailable questions", async () => {
  const calls = [];
  const row = (id, extra = {}) => ({
    sourceQuestionVersionId: id,
    latestOutcome: "INCORRECT",
    availableForReview: true,
    question: { subjectName: "약리학" },
    ...extra,
  });
  const read = loader(
    {},
    {
      "@/lib/client/fetch": {
        fetchAPI: async (url, method, params) => {
          calls.push({ url, method, params });
          if (url.endsWith("/collections")) {
            if (params.source === "CBT") return { items: [], nextCursor: null };
            const ref =
              params.source === "AI" ? "ai:1" : params.cursor ? "hc:2" : "hc:1";
            return {
              items: [{ collectionRef: ref, title: ref, wrong: 3 }],
              nextCursor:
                params.source === "HANDCRAFTED" && !params.cursor
                  ? "page-2"
                  : null,
            };
          }
          return {
            questions: url.endsWith("hc%3A2")
              ? [row("1"), row("2")]
              : [
                  row("1"),
                  row("correct", { latestOutcome: "CORRECT" }),
                  row("hidden", { availableForReview: false }),
                  row("unanswered", { latestOutcome: "UNANSWERED" }),
                ],
          };
        },
      },
    },
  )("lib/client/weakness.ts").readWeaknessLibrary;
  const result = await read();
  assert.deepEqual(normal(result.questions.map((item) => item.id)), [
    "HANDCRAFTED:1",
    "HANDCRAFTED:2",
    "AI:1",
  ]);
  assert.ok(calls.some((call) => call.params?.cursor === "page-2"));
  assert.ok(calls.every((call) => call.method === "GET"));
});

test("failed or cyclic review reads reject instead of presenting a false zero", async () => {
  for (const fetchAPI of [
    async () => {
      throw new Error("offline");
    },
    async () => ({ items: [], nextCursor: "repeated" }),
  ]) {
    const read = loader(
      {},
      { "@/lib/client/fetch": { fetchAPI } },
    )("lib/client/weakness.ts").readWeaknessLibrary;
    await assert.rejects(read());
  }
});

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
function harness(file, props, data = library) {
  const slots = [];
  const navigation = [];
  let index = 0;
  const hooks = {
    ...React,
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
  const Component = loader(
    {},
    {
      react: hooks,
      "lucide-react": new Proxy({}, { get: () => () => null }),
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
    },
  )(file).default;
  return {
    navigation,
    render() {
      index = 0;
      return Component(props);
    },
  };
}

test("weakness main links settings and classification, groups subjects and opens existing review", () => {
  const h = harness(
    "app/(learn)/learning/weakness/_components/WeaknessMain.tsx",
    { filters },
  );
  let tree = h.render();
  const html = renderToStaticMarkup(tree);
  for (const text of [
    "다시 풀 문제 수",
    "약점공략에는 약점만 모여요",
    "나의 약점 분야",
    "약점 문제 풀기",
    "전체",
    "과목별",
  ])
    assert.ok(html.includes(text), text);
  assert.ok(
    html.includes("/learning/weakness/areas?") &&
      html.includes("/learning/weakness/classification?"),
  );
  nodes(tree)
    .find((node) => node.props?.id === "weakness-tab-subjects")
    .props.onClick();
  tree = h.render();
  assert.ok(renderToStaticMarkup(tree).includes("약리학"));
  const aiOnly = harness(
    "app/(learn)/learning/weakness/_components/WeaknessMain.tsx",
    { filters },
    { ...library, questions: [library.questions[1]] },
  );
  nodes(aiOnly.render())
    .find((node) => node.props?.children === "약점 문제 풀기")
    .props.onClick();
  assert.deepEqual(aiOnly.navigation, [
    "/learning/review?mode=wrong&category=AI",
  ]);
});

test("settings enforce single range/sort, retain multiple sources and return to weakness main", () => {
  const h = harness(
    "app/(learn)/learning/weakness/_components/WeaknessSettings.tsx",
    { initialFilters: filters },
  );
  let tree = h.render();
  nodes(tree)
    .find(
      (node) =>
        node.type === "input" &&
        node.props.name === "weakness-range" &&
        node.props.value === "wrong",
    )
    .props.onChange();
  tree = h.render();
  assert.equal(
    nodes(tree).filter(
      (node) =>
        node.type === "input" &&
        node.props.name === "weakness-range" &&
        node.props.checked,
    ).length,
    1,
  );
  nodes(tree)
    .find((node) => node.type === "input" && node.props.value === "CBT")
    .props.onChange();
  tree = h.render();
  nodes(tree)
    .find(
      (node) =>
        node.type === "input" &&
        node.props.name === "weakness-sort" &&
        node.props.value === "recent",
    )
    .props.onChange();
  tree = h.render();
  const footer = nodes(tree).find((node) => node.type === "footer");
  assert.ok(
    footer.props.className.includes("fixed") &&
      footer.props.className.includes("safe-area-inset-bottom"),
  );
  nodes(footer)
    .find((node) => node.props?.onClick)
    .props.onClick();
  const url = new URL(h.navigation[0], "https://app.example");
  assert.equal(url.pathname, "/learning/weakness");
  assert.equal(url.searchParams.get("range"), "wrong");
  assert.equal(url.searchParams.get("sources"), "HANDCRAFTED,AI");
  assert.equal(url.searchParams.get("sort"), "recent");
});

test("classification guide shows all five requested learning destinations", async () => {
  const Page = loader(
    {},
    {
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/lib/navigation": { useRouter: () => ({ push() {} }) },
    },
  )("app/(learn)/learning/weakness/classification/page.tsx").default;
  const html = renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve({}) }),
  );
  for (const text of [
    "미풀이 문제",
    "문제 풀기",
    "맞힌 문제",
    "전체 학습 기록",
    "틀린 문제",
    "헷갈림 표시",
    "약점공략",
    "2회 연속 정답",
    "극복한 문제",
  ])
    assert.ok(html.includes(text), text);
});
