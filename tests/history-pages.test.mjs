import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";
const mocks = {
  "@/public/icons/question-bank.svg": () => null,
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "@/components/molecules/PracticeHeader": {
    PracticeHeader: ({ title, backHref }) =>
      React.createElement(
        "header",
        null,
        React.createElement("h1", null, title),
        React.createElement("a", { href: backHref }, "뒤로"),
      ),
  },
  "@/lib/navigation": { useRouter: () => ({ push() {} }) },
  "next/navigation": {
    redirect() {
      throw new Error("Unexpected redirect");
    },
  },
  "next/link": ({ children, href, ...props }) =>
    React.createElement("a", { href, ...props }, children),
};
const page = (path, query) => {
  const View = loader(
    {},
    {
      ...mocks,
      "@/hooks/queries/useLearningHistory": { useLearningHistory: () => query },
    },
  )(path).default;
  return renderToStaticMarkup(React.createElement(View));
};
test("full history owns the server summary and links back to mypage; recent history omits summary", () => {
  const query = {
    data: {
      pages: [
        {
          summary: { solvedCount: 13, correctCount: 5, weaknessCount: 5 },
          items: [],
        },
      ],
    },
    isPending: false,
    isError: false,
  };
  const full = page("app/(learn)/learning/history/page.tsx", query);
  for (const text of [
    "전체 학습 기록",
    "전체 학습 집계",
    "총 풀이",
    "정답",
    "약점공략",
    "13문제",
    "5문제",
  ])
    assert.ok(full.includes(text), text);
  assert.match(full, /href="\/mypage"/);
  const recent = page("app/(learn)/learning/recent/page.tsx", query);
  assert.match(recent, /최근 학습/);
  assert.match(recent, /href="\/questionbank"/);
  assert.doesNotMatch(recent, /전체 학습 집계|총 풀이|13문제/);
});
test("full history keeps loading and error states without inventing study totals", () => {
  for (const query of [{ isPending: true }, { isError: true, refetch() {} }]) {
    const html = page("app/(learn)/learning/history/page.tsx", query);
    assert.doesNotMatch(html, /0문제/);
    assert.ok(html.includes(query.isPending ? "불러오는 중" : "다시 시도"));
  }
});
test("mypage full-history item opens history and uses its dedicated colored icon", () => {
  const navigation = [];
  const MyPage = loader(
    {},
    {
      react: {
        ...React,
        useState: (initial) => [initial, () => {}],
        useEffect() {},
      },
      "@/components/atoms": { SystemField: () => null },
      "@/components/molecules": {
        BottomNavbar: () => null,
        MeaninglessHeader: () => null,
        SelectModal: () => null,
        UserInfoField: () => null,
      },
      "@/lib/client/auth": { isCurrentUserAdmin: () => false },
      "@/lib/navigation": {
        useRouter: () => ({ push: (path) => navigation.push(path) }),
      },
      "./_hooks": {
        useDelete: () => ({ onDelete() {} }),
        useLogout: () => ({ onLogout() {} }),
        useMyProfile: () => ({
          onMyProfile() {},
          isLoading: false,
          error: null,
          profile: {},
        }),
      },
      "./_components/ProfileLearningStatus": () => null,
    },
  )("app/(setting)/mypage/page.tsx").default;
  const nodes = (t) =>
    Array.isArray(t)
      ? t.flatMap(nodes)
      : t && typeof t === "object"
        ? [t, ...nodes(t.props?.children)]
        : [];
  const item = nodes(MyPage()).find((n) => n.props?.title === "전체 학습 기록");
  assert.ok(item);
  item.props.onClick();
  assert.deepEqual(navigation, ["/learning/history"]);
  assert.equal(item.props.iconSrc, "/icons/learning-history-colored.svg");
});
