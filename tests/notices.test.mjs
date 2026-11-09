import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server.js";
import { loader } from "./helpers/load-ts.mjs";

const notice = {
  id: "9007199254740997",
  title: "학습 기능 안내",
  content: "첫 문단\n\n다음 문단",
  type: "GENERAL",
  pinned: true,
  publishedAt: "2026-11-08T16:00:00Z",
  status: "PUBLISHED",
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const client = (fetchAPI) =>
  loader({}, { "./fetch": { fetchAPI } })("lib/client/notices.ts");

test("notice reads preserve identifiers, pagination, dates and upstream failures", async () => {
  const calls = [];
  const api = client(async (...args) => {
    calls.push(args);
    return args[0] === "/api/notices"
      ? { content: [notice], last: false }
      : notice;
  });
  assert.equal((await api.readNotices(2, 1)).content[0].id, notice.id);
  assert.equal((await api.readNotice(notice.id)).content, notice.content);
  assert.deepEqual(plain(calls), [
    ["/api/notices", "GET", { page: 2, size: 1 }],
    [`/api/notices/${notice.id}`, "GET"],
  ]);
  assert.equal(api.formatNoticeDate(notice.publishedAt), "2026.11.09");
  const denied = new Error("접근할 수 없습니다.");
  await assert.rejects(
    () =>
      client(async () => {
        throw denied;
      }).readNotices(),
    (error) => error === denied,
  );
  for (const bad of [
    null,
    { content: [], last: "false" },
    { content: [{ ...notice, id: 9007199254740997 }], last: true },
    { content: [{ ...notice, publishedAt: "invalid" }], last: true },
  ])
    await assert.rejects(() => client(async () => bad).readNotices());
});

test("publication validates content and uses the existing admin API without sending push", async () => {
  const calls = [];
  const api = client(async (...args) => {
    calls.push(args);
    return notice;
  });
  const result = await api.createNotice({
    title: " 제목 ",
    content: " 내용 ",
    pinned: false,
  });
  assert.equal(result.id, notice.id);
  assert.deepEqual(plain(calls), [
    [
      "/api/admin/notices",
      "POST",
      {
        title: "제목",
        content: "내용",
        pinned: false,
        type: "GENERAL",
        status: "PUBLISHED",
      },
    ],
  ]);
  for (const draft of [
    { title: " ", content: "내용", pinned: true },
    { title: "제목", content: "\n", pinned: true },
  ])
    await assert.rejects(() => api.createNotice(draft));
  assert.equal(calls.length, 1);
  for (const response of [null, {}, { ...notice, status: "DRAFT" }])
    await assert.rejects(() =>
      client(async () => response).createNotice({
        title: "제목",
        content: "내용",
        pinned: true,
      }),
    );
});

const nodes = (value) =>
  !value || typeof value !== "object"
    ? []
    : Array.isArray(value)
      ? value.flatMap(nodes)
      : [value, ...nodes(value.props?.children)];
const uiOverrides = {
  "next/link": ({ children, ...props }) => createElement("a", props, children),
  "lucide-react": new Proxy({}, { get: () => () => null }),
};

test("home shows only a pinned notice with no all-notices link and distinct loading or error states", () => {
  let query = { data: { content: [notice] }, isLoading: false, isError: false };
  const View = loader(
    {},
    {
      ...uiOverrides,
      "@/hooks/queries/useNoticesQuery": {
        useNoticesQuery: (page, size, enabled) => {
          assert.deepEqual([page, size, enabled], [0, 1, true]);
          return query;
        },
      },
    },
  )("app/_components/HomeNotice.tsx").default;
  let html = renderToStaticMarkup(createElement(View, { enabled: true }));
  assert.ok(html.includes(`/notices/${notice.id}`));
  assert.ok(html.includes(notice.title));
  assert.ok(!html.includes("전체 공지 보기"));
  for (const content of [[], [{ ...notice, pinned: false }]]) {
    query = { ...query, data: { content } };
    assert.equal(
      renderToStaticMarkup(createElement(View, { enabled: true })),
      "",
    );
  }
  query = { isLoading: true };
  assert.ok(
    renderToStaticMarkup(createElement(View, { enabled: true })).includes(
      "공지 불러오는 중",
    ),
  );
  let retried = false;
  query = {
    isError: true,
    refetch() {
      retried = true;
    },
  };
  const tree = View({ enabled: true });
  assert.ok(renderToStaticMarkup(tree).includes('role="alert"'));
  nodes(tree)
    .find((node) => node.type === "button")
    .props.onClick();
  assert.equal(retried, true);
});

test("notice article renders server text safely and keeps line breaks", () => {
  const Article = loader()(
    "components/notices/NoticeArticle.tsx",
  ).NoticeArticle;
  const html = renderToStaticMarkup(
    createElement(Article, {
      ...notice,
      content: "<script>alert(1)</script>\n다음 줄",
    }),
  );
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("whitespace-pre-wrap"));
  assert.ok(html.includes("2026.11.09"));
});

test("notice queries isolate accounts, gate admin access on the server, and disable publication retries", async () => {
  let userId = "first";
  let response = { content: [] };
  const calls = [];
  let mutation;
  const invalidated = [];
  const load = loader(
    {},
    {
      "@/hooks/useAuthIdentity": { useAuthIdentity: () => userId },
      "@tanstack/react-query": {
        useQuery: (value) => value,
        useMutation: (value) => (mutation = value),
        useQueryClient: () => ({
          invalidateQueries: (value) => invalidated.push(value),
        }),
      },
      "@/lib/client/fetch": {
        fetchAPI: async (...args) => {
          calls.push(args);
          return response;
        },
      },
    },
  );
  const hooks = load("hooks/queries/useNoticesQuery.ts");
  const first = hooks.useNoticesQuery();
  userId = "second";
  assert.notDeepEqual(first.queryKey, hooks.useNoticesQuery().queryKey);
  assert.equal(hooks.useNoticesQuery(0, 1, false).enabled, false);
  assert.equal(await hooks.useAdminNoticeAccessQuery().queryFn(), true);
  assert.equal(calls[0][0], "/api/admin/notices");
  response = {};
  await assert.rejects(() => hooks.useAdminNoticeAccessQuery().queryFn());
  userId = null;
  assert.equal(hooks.useNoticeQuery("1").enabled, false);
  assert.equal(hooks.useAdminNoticeAccessQuery().enabled, false);
  load("hooks/mutations/useCreateNoticeMutation.ts").useCreateNoticeMutation();
  assert.equal(mutation.retry, false);
  mutation.onSuccess();
  assert.deepEqual(plain(invalidated), [{ queryKey: ["notices"] }]);
});

function editor(
  access = { isPending: false, isSuccess: true },
  publish = async () => notice,
) {
  const slots = [];
  let cursor = 0;
  const calls = [];
  const navigation = [];
  const react = {
    ...React,
    useState(initial) {
      const at = cursor++;
      if (!(at in slots))
        slots[at] = typeof initial === "function" ? initial() : initial;
      return [
        slots[at],
        (value) => {
          slots[at] = typeof value === "function" ? value(slots[at]) : value;
        },
      ];
    },
    useRef(initial) {
      const at = cursor++;
      return (slots[at] ??= { current: initial });
    },
  };
  const create = {
    isPending: false,
    isError: false,
    mutateAsync: async (draft) => {
      calls.push(draft);
      return publish(draft);
    },
  };
  const View = loader(
    {},
    {
      react,
      ...uiOverrides,
      "@/components/molecules/AppShell": {
        AppShell: ({ children }) => createElement("main", null, children),
      },
      "@/components/molecules/CustomHeader": {
        CustomHeader: ({ title }) => createElement("header", null, title),
      },
      "@/lib/navigation": {
        useRouter: () => ({ replace: (href) => navigation.push(href) }),
      },
      "@/hooks/queries/useNoticesQuery": {
        useAdminNoticeAccessQuery: () => access,
      },
      "@/hooks/mutations/useCreateNoticeMutation": {
        useCreateNoticeMutation: () => create,
      },
    },
  )("app/(setting)/admin/notices/page.tsx").default;
  let tree;
  const render = () => {
    cursor = 0;
    return (tree = View());
  };
  render();
  return {
    calls,
    navigation,
    render,
    find: (predicate) => nodes(tree).find(predicate),
    type(id, value) {
      nodes(tree)
        .find((node) => node.props?.id === id)
        .props.onChange({ target: { value } });
      render();
    },
    submit() {
      return nodes(tree)
        .find((node) => node.type === "form")
        .props.onSubmit({ preventDefault() {} });
    },
  };
}

test("admin preview keeps the draft, publication respects home visibility, and double clicks publish once", async () => {
  let finish;
  const h = editor(
    undefined,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  h.type("notice-title", " 제목 ");
  h.type("notice-content", "첫 문단\n\n둘째 문단");
  h.find((node) => node.props?.id === "notice-pinned").props.onCheckedChange(
    false,
  );
  h.render();
  h.find((node) => node.props?.children === "미리보기").props.onClick();
  h.render();
  assert.equal(
    h.find((node) => node.props?.title === "제목").props.content,
    "첫 문단\n\n둘째 문단",
  );
  h.find((node) => node.props?.children === "수정하기").props.onClick();
  h.render();
  assert.equal(
    h.find((node) => node.props?.id === "notice-title").props.value,
    " 제목 ",
  );
  const first = h.submit();
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].pinned, false);
  finish(notice);
  await first;
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.navigation, [`/notices/${notice.id}`]);
});

test("denied admin access hides the editor and failures retain the draft", async () => {
  const denied = editor({ isPending: false, isSuccess: false });
  assert.equal(
    denied.find((node) => node.props?.id === "notice-title"),
    undefined,
  );
  const h = editor(undefined, async () => {
    throw new Error("network failure");
  });
  h.type("notice-title", "제목");
  h.type("notice-content", "보존할 내용");
  await h.submit();
  h.render();
  assert.equal(
    h.find((node) => node.props?.id === "notice-content").props.value,
    "보존할 내용",
  );
  assert.equal(h.navigation.length, 0);
});

test("admin notice proxy preserves authentication, body and backend rejection", async () => {
  const calls = [];
  const route = loader({
    process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.example" } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ message: "관리자 권한 필요" }), {
        status: 403,
      });
    },
  })("app/api/admin/notices/[[...path]]/route.ts");
  const body = {
    title: "제목",
    content: "내용",
    pinned: true,
    type: "GENERAL",
    status: "PUBLISHED",
  };
  const result = await route.POST(
    new NextRequest("http://local/api/admin/notices", {
      method: "POST",
      headers: {
        authorization: "Bearer admin-access",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  assert.equal(result.status, 403);
  assert.equal(calls[0].url, "https://backend.example/api/admin/notices");
  assert.equal(
    calls[0].options.headers.get("authorization"),
    "Bearer admin-access",
  );
  assert.deepEqual(
    JSON.parse(new TextDecoder().decode(calls[0].options.body)),
    body,
  );
  assert.equal(result.headers.get("cache-control"), "no-store");
});
