import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

function view(query, navigation = []) {
  const View = loader(
    {},
    {
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
      "next/link": ({ href, children, ...props }) =>
        React.createElement("a", { href, ...props }, children),
      "@/hooks/queries/useLearningDashboardQuery": {
        useLearningDashboardQuery: () => query,
      },
    },
  )("components/learning/PracticeResume.tsx").default;
  return View();
}
test("resume uses the dashboard's latest unfinished set and the correct engine with opaque identifiers", () => {
  for (const [source, target] of [
    ["AI", "/learning/ai?session="],
    ["CBT", "/learning/cbt?attempt="],
    ["HANDCRAFTED", "/questionbank/handcrafted?attempt="],
  ]) {
    const navigation = [];
    const tree = view(
      {
        data: {
          latestAttempt: {
            source,
            attemptId: "id/a+1",
            title: "이어서 볼 문제",
            subject: "약리학",
            answeredCount: 4,
            questionCount: 10,
          },
        },
      },
      navigation,
    );
    const html = renderToStaticMarkup(tree);
    const nodes = (t) =>
      Array.isArray(t)
        ? t.flatMap(nodes)
        : t && typeof t === "object"
          ? [t, ...nodes(t.props?.children)]
          : [];
    nodes(tree)
      .find((n) => n.props?.onClick)
      .props.onClick();
    assert.deepEqual(navigation, [`${target}id%2Fa%2B1`]);
    assert.match(html, /응답 4\/10문제/);
    assert.match(html, /진행률.*40%/s);
    assert.doesNotMatch(html, /<progress/);
    assert.doesNotMatch(html, /전체 최근 학습 보기/);
  }
});
test("resume loading, empty and failure stay distinct and do not invent progress", () => {
  for (const [query, expected] of [
    [{ isPending: true }, /불러오는 중/],
    [{ data: { latestAttempt: null } }, /진행 중인 학습이 없어요/],
    [{ isError: true, refetch() {} }, /다시 시도/],
  ]) {
    const html = renderToStaticMarkup(view(query));
    assert.match(html, expected);
    assert.doesNotMatch(html, /progress|0%|이어서 풀기/);
  }
});
