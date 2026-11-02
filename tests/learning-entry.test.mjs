import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";
const Icon = () => null;
const mocks = {
  "@/lib/navigation": { useRouter: () => ({ push: () => {} }) },
  "next/link": ({ children, href, prefetch, ...props }) =>
    React.createElement("a", { href, ...props }, children),
  "lucide-react": { RotateCcw: Icon, Layers: Icon },
  "@/public/icons/home.svg": Icon,
  "@/public/icons/archive.svg": Icon,
  "@/public/icons/user.svg": Icon,
  "@/public/icons/question-bank.svg": Icon,
  "@/public/icons/review.svg": Icon,
  "@/components/molecules/PracticeHeader": {
    PracticeHeader: ({ title }) => React.createElement("header", null, title),
  },
  "@/components/molecules/AppShell": { AppShell: ({ children }) => children },
};
test("bottom navigation replaces archive and selects learning and weakness destinations", () => {
  for (const [path, target] of [
    ["/", "/"],
    ["/questionbank/handcrafted", "/questionbank"],
    ["/learning/ai", "/questionbank"],
    ["/learning/recent", "/questionbank"],
    ["/flashcards", "/questionbank"],
    ["/learning/weakness/areas", "/learning/weakness"],
  ]) {
    const { BottomNavbar } = loader(
      {},
      { ...mocks, "next/navigation": { usePathname: () => path } },
    )("components/molecules/BottomNavbar.tsx");
    const html = renderToStaticMarkup(React.createElement(BottomNavbar));
    for (const text of ["홈", "문제 풀기", "약점공략", "마이 페이지"])
      assert.ok(html.includes(text));
    assert.equal(html.includes("아카이브"), false);
    assert.match(html, new RegExp(`href="${target}"[^>]*aria-current="page"`));
  }
});
test("problem hub reuses entries for three practice modes and a separate flashcard section", () => {
  const calls = [];
  const View = loader(
    {},
    {
      ...mocks,
      "@/lib/navigation": { useRouter: () => ({ push: (p) => calls.push(p) }) },
      "@/components/learning/RecentLearning": () => null,
    },
  )("app/(questionbank)/questionbank/page.tsx").default;
  const tree = View();
  const html = renderToStaticMarkup(tree);
  for (const text of ["학습 형태", "암기 학습", "AI 플래시카드"])
    assert.ok(html.includes(text));
  const nodes = (t) =>
    Array.isArray(t)
      ? t.flatMap(nodes)
      : t && typeof t === "object"
        ? [t, ...nodes(t.props?.children)]
        : [];
  const entries = nodes(tree).filter((n) => n.props?.title && n.props?.onClick);
  assert.equal(entries.length, 4);
  entries.find((n) => n.props.title === "AI 플래시카드").props.onClick();
  assert.deepEqual(calls, ["/flashcards"]);
});
test("recent learning keeps the paginated list without the full-history summary", () => {
  const View = loader(
    {},
    {
      ...mocks,
      "next/navigation": { useSearchParams: () => new URLSearchParams() },
      "@/hooks/queries/useLearningHistory": {
        useLearningHistory: () => ({
          data: {
            pages: [
              {
                items: [
                  {
                    source: "AI",
                    attemptId: "1",
                    title: "첫 세트",
                    questionCount: 2,
                    answeredCount: 2,
                    state: "COMPLETED",
                  },
                ],
              },
              {
                items: [
                  {
                    source: "AI",
                    attemptId: "2",
                    title: "다음 세트",
                    questionCount: 2,
                    answeredCount: 1,
                    state: "IN_PROGRESS",
                  },
                ],
              },
            ],
          },
          hasNextPage: true,
        }),
      },
    },
  )("app/(learn)/learning/recent/page.tsx").default;
  const html = renderToStaticMarkup(React.createElement(View));
  assert.equal(html.includes("총 풀이"), false);
  assert.equal(html.includes("전체 학습 집계"), false);
  for (const text of ["최근 학습", "첫 세트", "다음 세트", "더 보기"])
    assert.ok(html.includes(text));
});
