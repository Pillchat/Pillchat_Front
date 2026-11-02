import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const nodes = (tree) =>
  Array.isArray(tree)
    ? tree.flatMap(nodes)
    : tree && typeof tree === "object"
      ? [tree, ...nodes(tree.props?.children)]
      : [];

const ui = {
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "@/public/icons/file.svg": () => null,
  "@/components/molecules/AppShell": { AppShell: ({ children }) => children },
  "@/components/molecules/PracticeHeader": {
    PracticeHeader: ({ title }) => React.createElement("header", null, title),
  },
  "@/components/molecules": {
    CustomHeader: ({ title }) => React.createElement("header", null, title),
  },
  "@/components/atoms": {
    SolidButton: ({ content, ...props }) =>
      React.createElement("button", props, content),
  },
  "next/link": ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children),
  "../../_components/LoadingOverlay": () => null,
  "../_components/LoadingOverlay": () => null,
  "../_components/SubjectTopicModal": () => null,
};

function hooks() {
  let cursor = 0;
  const slots = [];
  const effects = [];
  return {
    reset() {
      cursor = 0;
    },
    effects,
    react: {
      ...React,
      useState(initial) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        return slots[i] ?? (slots[i] = { current: initial });
      },
      useCallback(fn) {
        return fn;
      },
      useEffect(fn) {
        effects.push(fn);
      },
    },
  };
}

test("AI entry offers topic and PDF flows without silently choosing PDF", () => {
  const navigation = [];
  const View = loader(
    {},
    {
      ...ui,
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
    },
  )("app/(questionbank)/questionbank/generate/page.tsx").default;
  const tree = View();
  const html = renderToStaticMarkup(tree);
  assert.match(html, /주제로 만들기/);
  assert.match(html, /PDF로 만들기/);
  assert.doesNotMatch(html, /type="file"/);
  for (const title of ["주제로 만들기", "PDF로 만들기"]) {
    nodes(tree)
      .find((node) => node.props?.title === title)
      .props.onClick();
  }
  assert.deepEqual(navigation, [
    "/questionbank/premium",
    "/questionbank/generate/pdf",
  ]);
});

function generationView(path, fetchAPI, fetch) {
  const state = hooks();
  const starts = [],
    sessions = [],
    navigation = [];
  const View = loader(
    { fetch },
    {
      ...ui,
      react: state.react,
      jotai: { useSetAtom: () => (value) => sessions.push(value) },
      "@/store/quizSession": {
        initQuizSessionAtom: {},
        mapChoices: (choices) => choices ?? [],
      },
      "@/lib/navigation": {
        useRouter: () => ({ push: (href) => navigation.push(href) }),
      },
      "@/lib/client/fetch": { fetchAPI, getToken: () => "test-token" },
      "@/lib/client/startQuiz": {
        startQuiz: async (body) => {
          starts.push(body);
          return {
            sessionId: 11,
            questions: [
              {
                id: 1,
                type: "MULTIPLE_CHOICE",
                content: "문제",
                choices: ["정답"],
                subject: "약리학",
              },
            ],
          };
        },
      },
    },
  )(path).default;
  return {
    ...state,
    starts,
    sessions,
    navigation,
    render() {
      state.reset();
      return View();
    },
  };
}

test("topic choice uses the existing subject and typed topic generation request through to a quiz", async () => {
  const calls = [];
  const view = generationView(
    "app/(questionbank)/questionbank/premium/page.tsx",
    async (url, method, body) => {
      calls.push({ url, method, body });
      if (url.endsWith("/subjects"))
        return [{ subjectId: 7, name: "약리학", categoryName: "약학" }];
      if (method === "POST") return { taskId: 9 };
      if (url.includes("/status/")) return { status: "COMPLETED" };
      if (url.includes("/result/"))
        return [{ id: 1, answer: "정답", explanation: "근거" }];
      throw Error(`Unexpected request ${url}`);
    },
  );
  view.render();
  view.effects.slice().forEach((effect) => effect());
  await new Promise(setImmediate);
  let tree = view.render();
  nodes(tree)
    .find(
      (node) => node.type === "button" && node.props.children[0] === "약리학",
    )
    .props.onClick();
  tree = view.render();
  nodes(tree)
    .find((node) => node.type === "button" && node.props.children === "객관식")
    .props.onClick();
  nodes(tree)
    .find((node) => node.props?.id === "ai-topic")
    .props.onChange({ target: { value: "  약물 상호작용  " } });
  tree = view.render();
  await nodes(tree)
    .find((node) => node.props?.content === "문제 생성")
    .props.onClick();
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(calls.find((call) => call.method === "POST").body),
    ),
    {
      type: "premium",
      subjectId: 7,
      questionType: "MULTIPLE_CHOICE",
      questionCount: 5,
      subjectHint: "약물 상호작용",
    },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(view.starts)), [
    { type: "PREMIUM", taskId: 9 },
  ]);
  assert.equal(view.sessions[0].questions[0].correctAnswer, "정답");
  assert.deepEqual(view.navigation, ["/questionbank/solve"]);
});

test("PDF choice validates its file then preserves upload, extraction and quiz start", async () => {
  const uploads = [];
  const view = generationView(
    "app/(questionbank)/questionbank/generate/pdf/page.tsx",
    async (url) => {
      assert.equal(url, "/api/questionbank/pdf/9/extract");
      return {
        status: "DONE",
        taskStatus: "COMPLETED",
        taskId: 10,
        questions: [{ id: 1, answer: "정답", explanation: "자료 근거" }],
      };
    },
    async (url, options) => {
      uploads.push({ url, options });
      return { ok: true, json: async () => ({ fileId: 9 }) };
    },
  );
  let tree = view.render();
  view.effects[0]();
  const choose = (file) =>
    nodes(tree)
      .find((node) => node.props?.type === "file")
      .props.onChange({ target: { files: [file], value: "selected" } });
  choose(new File(["image"], "image.png", { type: "image/png" }));
  tree = view.render();
  assert.equal(
    nodes(tree).find((node) => node.props?.content === "문제 생성").props
      .disabled,
    true,
  );
  assert.match(renderToStaticMarkup(tree), /PDF 파일만 업로드/);
  choose(
    new File(["%PDF-sample"], "학습자료.PDF", { type: "application/pdf" }),
  );
  tree = view.render();
  await nodes(tree)
    .find((node) => node.props?.content === "문제 생성")
    .props.onClick();
  assert.equal(uploads[0].url, "/api/questionbank/pdf");
  assert.equal(uploads[0].options.body.get("questionCount"), "10");
  assert.equal(uploads[0].options.body.get("file").name, "학습자료.PDF");
  assert.deepEqual(JSON.parse(JSON.stringify(view.starts)), [
    { type: "PDF", taskId: 10 },
  ]);
  assert.equal(view.sessions[0].questions[0].explanation, "자료 근거");
  assert.deepEqual(view.navigation, ["/questionbank/solve"]);
});
