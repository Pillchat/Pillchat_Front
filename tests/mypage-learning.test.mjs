import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const load = loader(
  {},
  {
    "next/link": ({ href, children, ...props }) =>
      React.createElement("a", { href, ...props }, children),
    "next/navigation": {
      notFound() {
        throw new Error("NOT_FOUND");
      },
    },
    "@/components/molecules/CustomHeader": {
      CustomHeader: ({ title }) => React.createElement("h1", null, title),
    },
  },
);
const Status = load(
  "app/(setting)/mypage/_components/ProfileLearningStatus.tsx",
).default;
const render = (profile) =>
  renderToStaticMarkup(React.createElement(Status, { profile }));
test("missing school or year links to existing personal information form", () => {
  for (const profile of [
    { school: null, studentGrade: "2학년" },
    { school: "약학대", studentGrade: " " },
  ]) {
    assert.match(render(profile), /href="\/onboarding"/);
  }
  assert.doesNotMatch(
    render({ school: "약학대", studentGrade: "약사" }),
    /정보 등록하기/,
  );
});
test("promotion uses server progress and distinguishes cumulative, streak and maximum grades", () => {
  const profile = { school: "약학대", studentGrade: "2학년" };
  assert.match(
    render({
      ...profile,
      nextPromotion: { nextGrade: "HANAL", target: 20, progress: 12 },
    }),
    /누적 출석 20일 · 8일/,
  );
  assert.match(
    render({
      ...profile,
      nextPromotion: { nextGrade: "DUAL", target: 50, progress: 2 },
    }),
    /연속 출석 50일 · 48일/,
  );
  assert.match(
    render({
      ...profile,
      nextPromotion: { nextGrade: null, target: 0, progress: 0 },
    }),
    /최고 등급/,
  );
  assert.doesNotMatch(render(profile), /최고 등급/);
});
test("legal pages show the existing signup text and reject unknown documents", async () => {
  const Page = load("app/(setting)/legal/[document]/page.tsx").default;
  const { TERMS_TEXT, PRIVACY_TEXT } = load(
    "app/(auth)/signup/_hooks/content.ts",
  );
  for (const [document, text, title] of [
    ["terms", TERMS_TEXT, "서비스 이용약관"],
    ["privacy", PRIVACY_TEXT, "개인정보 처리방침"],
  ]) {
    const tree = await Page({ params: Promise.resolve({ document }) });
    assert.equal(tree.props.children[1].props.children, text);
    assert.match(renderToStaticMarkup(tree), new RegExp(title));
  }
  await assert.rejects(
    Page({ params: Promise.resolve({ document: "unknown" }) }),
    /NOT_FOUND/,
  );
});
