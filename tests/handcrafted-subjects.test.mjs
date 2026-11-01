import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers/load-ts.mjs";

const directory = [
  { subjectId: 1, name: "생화학", categoryName: "기초약학" },
  { subjectId: 2, name: "약물학", categoryName: "기초약학" },
  { subjectId: 3, name: "임상약학", categoryName: "임상" },
];
const catalog = {
  banks: [],
  subjects: [
    {
      subjectId: "biochemistry",
      name: "생화학",
      availableCount: 153,
      topics: [
        { topicId: "topic-1", name: "대사", availableCount: 3 },
        { topicId: "topic-0", name: "준비 중인 주제", availableCount: 0 },
      ],
      sourceRevisions: [{ bankId: "real-bank", revisionId: "real-revision" }],
    },
  ],
};
const { handcraftedSubjects } = loader()("lib/learning/handcraftedSubjects.ts");

test("all AI subjects remain visible with actual handcrafted counts and original attempt identity", () => {
  const options = handcraftedSubjects(directory, catalog);
  assert.equal(options.length, 3);
  assert.equal(options[0].availableCount, 153);
  assert.equal(options[0].learningSubject.subjectId, "biochemistry");
  assert.equal(
    options[0].learningSubject.sourceRevisions[0].revisionId,
    "real-revision",
  );
  assert.equal(options[1].availableCount, 0);
  assert.equal(options[1].learningSubject, undefined);
});
test("an ID collision with a different subject never borrows its question count", () => {
  const collision = {
    banks: [],
    subjects: [{ ...catalog.subjects[0], subjectId: "2" }],
  };
  const options = handcraftedSubjects(directory, collision);
  assert.equal(options[0].availableCount, 153);
  assert.equal(options[1].availableCount, 0);
});

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
function setup(
  data = catalog,
  query = { data: directory, isPending: false, isError: false },
  availabilityOverride,
) {
  let cursor = 0;
  const slots = [];
  const calls = [];
  let effects = [];
  let tree;
  const hooks = {
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
    useEffect(fn) {
      effects.push(fn);
    },
  };
  const load = loader(
    {
      window: {
        location: {
          href: "https://app.example/questionbank/handcrafted",
          search: "",
        },
        history: { replaceState() {} },
      },
    },
    {
      react: hooks,
      "@/hooks/queries/useHandcraftedSelectionQueries": {
        useHandcraftedSubjectsQuery: () => query,
        useHandcraftedAvailabilityQuery: (subjectId, topicId) =>
          availabilityOverride ?? {
            data: {
              newCount:
                (topicId
                  ? data?.subjects
                      .find((s) => s.subjectId === subjectId)
                      ?.topics.find((t) => t.topicId === topicId)
                      ?.availableCount
                  : data?.subjects.find((s) => s.subjectId === subjectId)
                      ?.availableCount) ?? 0,
              answeredCount: 0,
              inProgressCount: 0,
              weaknessCount: 0,
            },
            isPending: false,
            isError: false,
            refetch: () => {},
          },
      },
      "@tanstack/react-query": { useQuery: () => query },
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => "user-1" },
      "@/lib/client/fetch": {
        fetchAPI: () => {
          throw new Error("unexpected fetch");
        },
      },
      "next/link": () => null,
      "@/components/atoms/LoadingIndicator": { LoadingIndicator: () => null },
    },
  );
  const View = load(
    "components/learning/practice/HandcraftedSetup.tsx",
  ).default;
  const session = {
    catalog: data,
    disabled: false,
    busy: false,
    history: [],
    startHandcrafted(...args) {
      calls.push(args);
      return Promise.resolve(true);
    },
  };
  const render = () => {
    cursor = 0;
    effects = [];
    tree = View({ session });
    effects.forEach((fn) => fn());
    return tree;
  };
  render();
  render();
  return {
    render,
    calls,
    find: (predicate) => nodes(tree).find(predicate),
    all: (predicate) => nodes(tree).filter(predicate),
    submit() {
      nodes(tree)
        .find((node) => node.type === "form")
        .props.onSubmit({ preventDefault() {} });
    },
  };
}
test("dropdown disables unpublished subjects and sends the original server subject when starting", () => {
  const h = setup();
  const available = h.find(
    (node) => node.type === "option" && node.props.value === "1",
  );
  const unavailable = h.find(
    (node) => node.type === "option" && node.props.value === "2",
  );
  assert.equal(available.props.disabled, false);
  assert.equal(available.props.children.join(""), "생화학 (153문항)");
  assert.equal(unavailable.props.disabled, true);
  assert.equal(unavailable.props.children.join(""), "약물학 (0문항)");
  assert.equal(h.all((node) => node.type === "select").length, 1);
  assert.equal(h.all((node) => node.type === "input").length, 0);
  h.submit();
  assert.deepEqual(h.calls, [["biochemistry", "", 3]]);
  h.find(
    (node) => node.type === "button" && node.props.children === "대사",
  ).props.onClick();
  h.render();
  assert.equal(
    h.find((node) => node.type === "button" && node.props.children === "5문제")
      .props.disabled,
    undefined,
  );
  h.submit();
  assert.deepEqual(h.calls[1], ["biochemistry", "topic-1", 3]);
});
test("zero published questions and unavailable catalogs cannot start an attempt", () => {
  for (const catalog of [{ banks: [], subjects: [] }, null]) {
    const h = setup(catalog);
    assert.equal(
      h.find((node) => node.type === "button" && node.props.type === "submit")
        .props.disabled,
      true,
    );
    h.submit();
    assert.equal(h.calls.length, 0);
  }
});
test("restored count buttons respect the server limit and the selected topic", () => {
  const h = setup();
  h.find(
    (node) => node.type === "button" && node.props.children === "최대 30문제",
  ).props.onClick();
  h.render();
  h.submit();
  assert.deepEqual(h.calls[0], ["biochemistry", "", 30]);
  h.find(
    (node) => node.type === "button" && node.props.children === "대사",
  ).props.onClick();
  h.render();
  h.submit();
  assert.deepEqual(h.calls[1], ["biochemistry", "topic-1", 3]);
  h.find(
    (node) =>
      node.type === "button" && node.props.children === "준비 중인 주제",
  ).props.onClick();
  h.render();
  h.submit();
  assert.equal(h.calls.length, 2);
});

test("shortage starts only remaining unseen questions; zero and loading block starts", () => {
  const h = setup(catalog, undefined, {
    data: {
      newCount: 8,
      answeredCount: 12,
      weaknessCount: 5,
      inProgressCount: 2,
    },
    isPending: false,
    isError: false,
  });
  h.find(
    (n) => n.type === "button" && n.props.children === "20문제",
  ).props.onClick();
  h.render();
  assert.equal(
    h.find((n) => n.type === "button" && n.props.type === "submit").props
      .children,
    "새 문제 8개로 시작",
  );
  h.submit();
  assert.deepEqual(h.calls, [["biochemistry", "", 8]]);
  for (const query of [
    {
      data: {
        newCount: 0,
        answeredCount: 20,
        weaknessCount: 5,
        inProgressCount: 0,
      },
      isPending: false,
      isError: false,
    },
    { isPending: true },
    { isPending: false, isError: true },
  ]) {
    const blocked = setup(catalog, undefined, query);
    assert.equal(
      blocked.find((n) => n.type === "button" && n.props.type === "submit")
        .props.disabled,
      true,
    );
    blocked.submit();
    assert.equal(blocked.calls.length, 0);
  }
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("availability cache and request are scoped by user and selected topic", async () => {
  let query;
  const calls = [];
  const load = loader(
    {},
    {
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => "owner-7" },
      "@tanstack/react-query": {
        useQuery: (options) => {
          query = options;
          return options;
        },
      },
      "@/lib/client/fetch": {
        fetchAPI: (...args) => {
          calls.push(args);
          return Promise.resolve({ newCount: 8 });
        },
      },
    },
  );
  const { useHandcraftedAvailabilityQuery } = load(
    "hooks/queries/useHandcraftedSelectionQueries.ts",
  );
  useHandcraftedAvailabilityQuery("subject-1", "topic-3");
  assert.deepEqual(Array.from(query.queryKey), [
    "handcrafted-availability",
    "owner-7",
    "subject-1",
    "topic-3",
  ]);
  await query.queryFn();
  assert.equal(calls[0][0], "/api/learning/handcrafted/availability");
  assert.equal(calls[0][2].topicId, "topic-3");
  useHandcraftedAvailabilityQuery(undefined);
  assert.equal(query.enabled, false);
});

test("result shows topic breakdown, confusion count and weakness destination", () => {
  const load = loader(
    {},
    {
      "@/hooks/queries/useWeaknessQuery": {
        useWeaknessQuery: () => ({
          data: {
            questions: [
              { source: "HANDCRAFTED", questionId: "q-1", confused: true },
            ],
          },
        }),
      },
      "lucide-react": { Trophy: () => null },
      "@/components/molecules": {
        AppShell: ({ children }) => children,
        PracticeHeader: () => null,
      },
      "@/components/learning/ConfusionToggle": { ConfusionToggle: () => null },
      "@/components/learning/TutorialButton": { TutorialButton: () => null },
      "next/link": ({ href, children }) =>
        React.createElement("a", { href }, children),
    },
  );
  const { PracticeResult } = load(
    "components/learning/practice/PracticeResult.tsx",
  );
  const markup = renderToStaticMarkup(
    React.createElement(PracticeResult, {
      session: {
        source: "HANDCRAFTED",
        result: {
          score: 50,
          counts: { total: 2, correct: 1, incorrect: 1, unanswered: 0 },
          questions: [
            {
              question: {
                sourceQuestionVersionId: "q-1",
                subjectName: "약물학",
                topicName: "고혈압",
              },
              grade: { outcome: "CORRECT" },
            },
            {
              question: {
                sourceQuestionVersionId: "q-2",
                subjectName: "약물학",
                topicName: "당뇨",
              },
              grade: { outcome: "INCORRECT" },
            },
          ],
        },
      },
      onTutorial() {},
    }),
  );
  assert.match(markup, /고혈압/);
  assert.match(markup, /당뇨/);
  assert.match(markup, /헷갈림/);
  assert.match(markup, /정답률 50%/);
  assert.match(markup, /sources=HANDCRAFTED/);
  assert.match(markup, /같은 조건으로 새 문제/);
});
