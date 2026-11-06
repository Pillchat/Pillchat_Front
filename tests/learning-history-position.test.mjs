import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { loader, storage } from "./helpers/load-ts.mjs";

function browser() {
  const sessionStorage = storage();
  const frames = new Map();
  const scrolls = [];
  let sequence = 0;
  const anchor = {
    getAttribute: () => "CBT:opaque/id",
    getBoundingClientRect: () => ({ top: 120 }),
  };
  return {
    sessionStorage,
    frames,
    scrolls,
    anchor,
    globals: {
      sessionStorage,
      window: {
        scrollY: 362,
        scrollTo: (position) => scrolls.push(position.top),
      },
      document: { querySelectorAll: () => [anchor] },
      requestAnimationFrame: (callback) => {
        frames.set(++sequence, callback);
        return sequence;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
    },
    flush() {
      for (const callback of frames.values()) callback();
      frames.clear();
    },
  };
}
function mount(env, identity = "user-7") {
  const refs = [],
    previous = [];
  let index,
    effects,
    user = identity;
  const usePosition = loader(env.globals, {
    react: {
      ...React,
      useRef(initial) {
        const i = index++;
        return (refs[i] ??= { current: initial });
      },
      useEffect(callback, deps) {
        const i = index++;
        if (!previous[i] || deps.some((value, n) => value !== previous[i][n])) {
          previous[i] = deps;
          effects.push(callback);
        }
      },
    },
    "@/hooks/useAuthIdentity": { useAuthIdentity: () => user },
  })("hooks/useLearningHistoryPosition.ts").useLearningHistoryPosition;
  return {
    identity(value) {
      user = value;
    },
    render(href, query) {
      index = 0;
      effects = [];
      const save = usePosition(href, query);
      effects.forEach((callback) => callback());
      return save;
    },
  };
}
const query = (count, extra = {}) => ({
  data: { pages: Array.from({ length: count }, () => ({ items: [] })) },
  hasNextPage: true,
  isFetching: false,
  isError: false,
  fetchNextPage() {},
  ...extra,
});

test("history return reloads missing pages before restoring the selected card's relative position", () => {
  const env = browser();
  const origin = mount(env);
  origin.render("/learning/recent?filter=wrong", query(3))(env.anchor);
  let fetched = 0;
  const returning = mount(env);
  const fetchNextPage = () => fetched++;
  returning.render(
    "/learning/recent?filter=wrong",
    query(1, { fetchNextPage }),
  );
  assert.equal(fetched, 1);
  assert.equal(env.frames.size, 0);
  returning.render(
    "/learning/recent?filter=wrong",
    query(3, { fetchNextPage, isFetching: true }),
  );
  assert.equal(env.frames.size, 0);
  env.globals.window.scrollY = 0;
  env.anchor.getBoundingClientRect = () => ({ top: 482 });
  returning.render(
    "/learning/recent?filter=wrong",
    query(3, { fetchNextPage }),
  );
  env.flush();
  assert.deepEqual(env.scrolls, [362]);
  assert.equal(
    env.sessionStorage.getItem(
      "pillchat:history-position:user-7:/learning/recent?filter=wrong",
    ),
    null,
  );
});

test("history positions are isolated by account and list filter; errors do not trigger pagination loops", () => {
  const env = browser();
  mount(env).render("/learning/recent?filter=wrong", query(2))(env.anchor);
  mount(env, "other-user").render("/learning/recent?filter=wrong", query(1));
  mount(env).render("/learning/recent?filter=correct", query(1));
  mount(env).render("/learning/history?filter=wrong", query(1));
  let fetched = 0;
  mount(env).render(
    "/learning/recent?filter=wrong",
    query(1, {
      isError: true,
      fetchNextPage() {
        fetched++;
      },
    }),
  );
  env.flush();
  assert.deepEqual(env.scrolls, []);
  assert.equal(fetched, 0);
});

test("unavailable storage and malformed positions leave normal history navigation intact", () => {
  for (const value of [
    "invalid json",
    JSON.stringify({ top: -1, pages: 5 }),
    JSON.stringify({ top: 300, pages: 1.5, anchor: "x", offset: 3 }),
  ]) {
    const env = browser();
    env.sessionStorage.setItem(
      "pillchat:history-position:user-7:/learning/recent",
      value,
    );
    mount(env).render("/learning/recent", query(1));
    env.flush();
    assert.deepEqual(env.scrolls, []);
  }
  const env = browser();
  env.globals.sessionStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  assert.doesNotThrow(() =>
    mount(env).render("/learning/recent", query(1))(env.anchor),
  );
});
