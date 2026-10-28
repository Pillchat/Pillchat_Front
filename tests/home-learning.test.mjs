import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server.js";
import { loader } from "./helpers/load-ts.mjs";

const model = loader()("lib/learning/dashboard.ts");
const data = {
  date: "2026-10-28",
  solvedCount: 20,
  correctCount: 15,
  studySeconds: 3660,
  latestAttempt: {
    attemptId: "9007199254740997",
    source: "HANDCRAFTED",
    title: "최근에 풀던 임상약학",
    answeredCount: 3,
    questionCount: 10,
  },
};

test("study time handles empty, short, minute and hour durations", () => {
  for (const [seconds, expected] of [
    [0, "0분"],
    [45, "1분 미만"],
    [60, "1분"],
    [3599, "59분"],
    [3600, "1시간"],
    [3660, "1시간 1분"],
  ]) {
    assert.equal(model.formatStudyTime(seconds), expected);
  }
});

test("resume links use each engine and preserve opaque identifiers", () => {
  for (const [source, expected] of [
    ["CBT", "/learning/cbt?attempt="],
    ["HANDCRAFTED", "/questionbank/handcrafted?attempt="],
    ["AI", "/learning/ai?session="],
  ]) {
    assert.equal(
      model.dashboardAttemptHref({
        ...data.latestAttempt,
        source,
        attemptId: "id/a+b&1",
      }),
      `${expected}id%2Fa%2Bb%261`,
    );
  }
});

function overview(props) {
  const navigation = [];
  const View = loader(
    {},
    {
      "lucide-react": new Proxy({}, { get: () => () => null }),
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
    },
  )("app/_components/HomeLearningOverview.tsx").default;
  return {
    tree: View({ pending: false, isError: false, onRetry() {}, ...props }),
    navigation,
  };
}
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}

test("home reuses cards to show server totals and sends users to resume and shortcuts", () => {
  const view = overview({ data });
  const html = renderToStaticMarkup(view.tree);
  for (const text of [
    "오늘의 학습 현황",
    "20문제",
    "75%",
    "1시간 1분",
    data.latestAttempt.title,
    "3 / 10문제",
    "수제 제작 문제",
    "약점공략",
  ])
    assert.ok(html.includes(text), text);
  const entries = nodes(view.tree).filter((node) => node.props?.onClick);
  entries.forEach((entry) => entry.props.onClick());
  assert.deepEqual(view.navigation, [
    "/questionbank/handcrafted?attempt=9007199254740997",
    "/questionbank/handcrafted",
    "/learning/review?mode=wrong",
  ]);
});

test("empty progress differs from failed or pending reads and never fabricates totals", () => {
  const empty = renderToStaticMarkup(
    overview({
      data: {
        ...data,
        solvedCount: 0,
        correctCount: 0,
        studySeconds: 0,
        latestAttempt: null,
      },
    }).tree,
  );
  assert.ok(
    empty.includes("0문제") &&
      empty.includes("0%") &&
      empty.includes("진행 중인 문제풀이가 없어요"),
  );
  const pending = renderToStaticMarkup(overview({ pending: true }).tree);
  assert.ok(pending.includes("불러오는 중"));
  assert.ok(!pending.includes("0문제"));
  let retried = false;
  const failed = overview({
    isError: true,
    onRetry: () => {
      retried = true;
    },
  });
  const html = renderToStaticMarkup(failed.tree);
  assert.ok(
    html.includes('role="alert"') &&
      html.includes("최근 학습 기록을 확인하지 못했어요"),
  );
  assert.ok(!html.includes("진행 중인 문제풀이가 없어요"));
  nodes(failed.tree)
    .find((node) => node.type === "button")
    .props.onClick();
  assert.equal(retried, true);
});

test("dashboard query scopes cached data to the current user and uses the real API", async () => {
  const calls = [];
  let userId = "first";
  const useDashboard = loader(
    {},
    {
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => userId },
      "@tanstack/react-query": { useQuery: (options) => options },
      "@/lib/client/fetch": {
        fetchAPI: async (...args) => {
          calls.push(args);
          return data;
        },
      },
    },
  )("hooks/queries/useLearningDashboardQuery.ts").useLearningDashboardQuery;
  const first = useDashboard(true);
  assert.equal(await first.queryFn(), data);
  userId = "second";
  assert.notDeepEqual(first.queryKey, useDashboard(true).queryKey);
  assert.equal(useDashboard(false).enabled, false);
  userId = null;
  assert.equal(useDashboard(true).enabled, false);
  assert.deepEqual(calls, [["/api/learning/dashboard", "GET"]]);
});

test("existing learning proxy forwards dashboard credentials, data and failures", async () => {
  let upstream;
  let status = 200;
  const route = loader({
    process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.example" } },
    fetch: async (url, options) => {
      upstream = { url, options };
      return Response.json(status === 200 ? data : { message: "unavailable" }, {
        status,
      });
    },
  })("app/api/learning/[...path]/route.ts");
  const request = new NextRequest(
    "https://app.example/api/learning/dashboard",
    { headers: { authorization: "Bearer token" } },
  );
  const response = await route.GET(request);
  assert.deepEqual(await response.json(), data);
  assert.equal(upstream.url, "https://backend.example/api/learning/dashboard");
  assert.equal(upstream.options.headers.get("authorization"), "Bearer token");
  assert.equal(response.headers.get("cache-control"), "no-store");
  status = 503;
  assert.equal((await route.GET(request)).status, 503);
});
