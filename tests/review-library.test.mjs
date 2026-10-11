import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { loader } from "./helpers/load-ts.mjs";

const model = loader()("lib/learning/review.ts");
test("review links preserve the server engine and opaque identifiers", () => {
  assert.equal(
    model.reviewAttemptHref({
      engine: "LEARNING",
      result: { attempt: { source: "CBT", attemptId: "exam/a+b" } },
    }),
    "/learning/cbt?attempt=exam%2Fa%2Bb",
  );
  assert.equal(
    model.reviewAttemptHref({
      engine: "LEARNING",
      result: {
        attempt: { source: "HANDCRAFTED", attemptId: "9007199254740997" },
      },
    }),
    "/questionbank/handcrafted?attempt=9007199254740997",
  );
  assert.equal(
    model.reviewAttemptHref({
      engine: "LEGACY_AI",
      result: { sessionId: "session&1" },
    }),
    "/learning/ai?session=session%261",
  );
  assert.throws(() =>
    model.reviewAttemptHref({
      engine: "LEARNING",
      result: { attempt: { source: "UNKNOWN", attemptId: "1" } },
    }),
  );
});

const collection = {
  collectionRef: "opaque/server-ref",
  source: "HANDCRAFTED",
  title: "서버에 저장된 문제 모음",
  total: 8,
  wrong: 3,
  bookmarked: 2,
};
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
function harness(fetchAPI, query = "") {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let tree;
  const changed = (a, b) =>
    !a ||
    a.length !== b.length ||
    a.some((value, index) => !Object.is(value, b[index]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots))
        slots[index] = typeof initial === "function" ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      return (slots[index] ??= { current: initial });
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) slots[index] = { value: fn, deps };
      return slots[index].value;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) {
        const old = slots[index];
        slots[index] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          slots[index].cleanup = fn();
        });
      }
    },
  };
  class ApiError extends Error {
    constructor(status) {
      super("API failed");
      this.status = status;
    }
  }
  const navigation = [];
  const window = {
    location: {
      href: `http://localhost/learning/review${query}`,
      search: query,
    },
    history: {
      replaceState(_a, _b, url) {
        window.location.href = String(url);
      },
    },
  };
  const Card = () => null;
  const Sheet = () => null;
  const load = loader(
    { window },
    {
      react: hooks,
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/lib/client/fetch": { fetchAPI, ApiError },
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => "user-1" },
      "@/components/molecules": { PracticeHeader: () => null },
      "@/components/atoms/LoadingIndicator": { LoadingIndicator: () => null },
      "@/app/(questionbank)/questionbank/_components/CategoryCard": Card,
      "@/app/(questionbank)/questionbank/_components/ActionSheet": Sheet,
    },
  );
  const Page = load("app/(learn)/learning/review/page.tsx").default;
  const Library = Page().type;
  const render = () => {
    cursor = 0;
    effects = [];
    tree = Library();
    const queued = effects;
    effects = [];
    queued.forEach((run) => run());
    return tree;
  };
  return {
    render,
    navigation,
    Card,
    Sheet,
    async settle() {
      for (let i = 0; i < 3; i++) {
        render();
        await new Promise((done) => setImmediate(done));
      }
      render();
    },
    find(predicate) {
      return nodes(tree).find(predicate);
    },
    cards() {
      return nodes(tree).filter((node) => node.type === Card);
    },
    sheet() {
      return nodes(tree).find((node) => node.type === Sheet);
    },
    tab(source) {
      return nodes(tree).find(
        (node) => node.props?.id === `review-tab-${source}`,
      );
    },
  };
}

test("legacy cards and selection sheet use server counts and send the selected review mode", async () => {
  const calls = [];
  const h = harness(async (url, method, body) => {
    calls.push({ url, method, body });
    return method === "GET"
      ? { items: [collection], nextCursor: null }
      : {
          engine: "LEARNING",
          result: {
            attempt: { source: "HANDCRAFTED", attemptId: "real-attempt" },
          },
        };
  }, "?category=HANDCRAFTED");
  await h.settle();
  assert.equal(calls[0].url, "/api/learning/review/collections");
  assert.equal(calls[0].body.source, "HANDCRAFTED");
  assert.equal(h.cards()[0].props.item.title, collection.title);
  assert.equal(h.cards()[0].props.item.totalQuestionCount, 8);
  h.cards()[0].props.onClick();
  h.render();
  const sheet = h.sheet();
  assert.equal(sheet.props.isOpen, true);
  assert.equal(sheet.props.wrongCount, 3);
  assert.equal(sheet.props.bookmarkedCount, 2);
  sheet.props.onSelectMode("bookmarked");
  sheet.props.onClose();
  await h.settle();
  assert.equal(calls[1].url, "/api/learning/review/attempts");
  assert.equal(calls[1].body.collectionRef, collection.collectionRef);
  assert.equal(calls[1].body.mode, "BOOKMARKED");
  assert.deepEqual(h.navigation, [
    "/questionbank/handcrafted?attempt=real-attempt",
  ]);
});

test("a slow old tab response cannot replace the newly selected source", async () => {
  const old = deferred();
  const current = deferred();
  const h = harness((_url, _method, body) =>
    body.source === "CBT" ? old.promise : current.promise,
  );
  await h.settle();
  h.tab("AI").props.onClick();
  await h.settle();
  current.resolve({
    items: [{ ...collection, source: "AI", title: "AI 서버 문제" }],
    nextCursor: null,
  });
  await h.settle();
  old.resolve({
    items: [{ ...collection, source: "CBT", title: "늦게 도착한 CBT" }],
    nextCursor: null,
  });
  await h.settle();
  assert.equal(h.cards()[0].props.item.title, "AI 서버 문제");
});

test("uncertain review creation keeps the original body and UUID for retry", async () => {
  const attempts = [];
  const h = harness(async (_url, method, body) => {
    if (method === "GET")
      return { items: [{ ...collection, source: "CBT" }], nextCursor: null };
    attempts.push(body);
    if (attempts.length === 1) throw new TypeError("offline");
    return {
      engine: "LEARNING",
      result: { attempt: { source: "CBT", attemptId: "resumed" } },
    };
  });
  await h.settle();
  h.cards()[0].props.onClick();
  h.render();
  assert.equal(h.sheet().props.allowBookmarks, false);
  h.sheet().props.onSelectMode("wrong");
  h.sheet().props.onClose();
  await h.settle();
  assert.equal(h.tab("AI").props.disabled, true);
  h.find(
    (node) => node.type === "button" && node.props.children === "다시 시도",
  ).props.onClick();
  await h.settle();
  assert.equal(attempts[0], attempts[1]);
  assert.ok(attempts[0].idempotencyKey);
  assert.equal(attempts[0].mode, "WRONG");
  assert.deepEqual(h.navigation, ["/learning/cbt?attempt=resumed"]);
});
