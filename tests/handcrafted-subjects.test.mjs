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
    {},
    {
      react: hooks,
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
    true,
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
