import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";
const normal = (value) => JSON.parse(JSON.stringify(value));
const q = {
  attemptQuestionId: "9007199254740997",
  sourceQuestionVersionId: "rev-q",
  ordinal: 1,
  stem: "서버가 제공한 약동학 문제",
  referenceContent: "서버의 사례 본문",
  subjectName: "임상약학",
  choices: [
    { choiceId: "opaque-B", text: "서버 선택지 B" },
    { choiceId: "opaque-A", text: "서버 선택지 A" },
  ],
  media: [
    { downloadUrl: "https://files.example/figure.png", alt: "서버 도표" },
  ],
};
const a = {
  attemptQuestionId: q.attemptQuestionId,
  selectedChoiceId: "opaque-A",
  memo: "저장된 메모",
  flagged: true,
  excludedChoiceIds: ["opaque-B"],
  version: 8,
  finalized: false,
};
const attempt = {
  attemptId: "attempt-server",
  source: "CBT",
  mode: "SESSION",
  state: "IN_PROGRESS",
  title: "서버에서 게시한 시험",
  currentSectionId: "section-1",
  currentQuestionId: q.attemptQuestionId,
  serverNow: "2026-10-11T01:00:00Z",
  resultAvailable: false,
  sections: [
    {
      sectionId: "section-1",
      title: "서버 교시",
      state: "IN_PROGRESS",
      version: 3,
      deadlineAt: "2026-10-11T01:02:00Z",
      scheduledStartAt: null,
    },
  ],
  currentSectionQuestions: [q],
  savedAnswers: [a],
};
const model = loader()("lib/learning/presentation.ts");
test("legacy presentation uses server content, real media, and opaque choice identities", () => {
  const question = model.cbtQuestion(q, 0);
  const answer = model.cbtAnswer(q, a);
  assert.equal(question.stem, q.stem);
  assert.equal(question.subject, "임상약학");
  assert.equal(question.media[0].url, q.media[0].downloadUrl);
  assert.equal(answer.selectedChoice, 1);
  assert.deepEqual(normal(answer.excludedChoices), [0]);
  assert.deepEqual(
    normal(model.choicePatch(q, { selectedChoice: 0, excludedChoices: [1] })),
    { selectedChoiceId: "opaque-B", excludedChoiceIds: ["opaque-A"] },
  );
  assert.deepEqual(normal(model.choicePatch(q, { selectedChoice: null })), {
    selectedChoiceId: null,
  });
  assert.throws(() => model.choicePatch(q, { selectedChoice: 4 }));
});
test("memo flush preserves versions for every dirty answer and excludes finalized answers", () => {
  const other = { ...a, attemptQuestionId: "second", version: 12 };
  const finalized = { ...a, attemptQuestionId: "done", finalized: true };
  const next = { ...attempt, savedAnswers: [a, other, finalized] };
  const updates = model.answerUpdates(
    next,
    {
      [a.attemptQuestionId]: "new",
      second: "second memo",
      done: "must not save",
    },
    a.attemptQuestionId,
    { selectedChoiceId: "opaque-B" },
  );
  assert.deepEqual(normal(updates), [
    {
      attemptQuestionId: a.attemptQuestionId,
      expectedVersion: 8,
      memo: "new",
      selectedChoiceId: "opaque-B",
    },
    { attemptQuestionId: "second", expectedVersion: 12, memo: "second memo" },
  ]);
});

test("choice explanations follow displayed choice identities, even with shuffled or missing details", () => {
  const question = {
    ...q,
    choices: [...q.choices, { choiceId: "opaque-C", text: "서버 선택지 C" }],
  };
  const grade = {
    correctChoiceId: "opaque-A",
    explanation: "전체 해설",
    choices: [
      { choiceId: "opaque-C", explanation: "C의 해설" },
      { choiceId: "foreign", explanation: "다른 문제의 해설" },
      { choiceId: "opaque-B", explanation: "B의 해설" },
    ],
  };
  assert.deepEqual(
    normal(model.choiceExplanations(question, grade)).map(
      ({ number, explanation }) => ({ number, explanation }),
    ),
    [
      { number: 1, explanation: "B의 해설" },
      { number: 3, explanation: "C의 해설" },
    ],
  );
  assert.deepEqual(
    normal(model.choiceExplanations(question, { ...grade, choices: [] })),
    [],
  );
  assert.equal(question.choices[0].choiceId, "opaque-B");
  assert.equal(grade.choices[0].choiceId, "opaque-C");
});
test("timer follows server offset and break deadlines without finalizing locally", () => {
  const clientNow = Date.parse("2026-10-11T00:55:00Z");
  assert.equal(model.secondsRemaining(attempt, clientNow, 5 * 60 * 1000), 120);
  assert.equal(
    model.secondsRemaining(attempt, clientNow + 180000, 5 * 60 * 1000),
    0,
  );
  assert.equal(attempt.state, "IN_PROGRESS");
  assert.equal(
    model.secondsRemaining(
      {
        ...attempt,
        state: "BREAK",
        sections: [
          { ...attempt.sections[0], scheduledStartAt: "2026-10-11T01:10:00Z" },
        ],
      },
      clientNow,
      300000,
    ),
    600,
  );
});

function hookHarness(fetchAPI, source = "CBT") {
  const values = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in values))
        values[i] = typeof initial === "function" ? initial() : initial;
      return [
        values[i],
        (value) => {
          values[i] = typeof value === "function" ? value(values[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = { current: initial };
      return values[i];
    },
    useCallback: (fn) => fn,
    useEffect() {},
  };
  class ApiError extends Error {
    constructor(status) {
      super("server error");
      this.status = status;
    }
  }
  const window = {
    location: { href: "http://localhost/learning/cbt" },
    history: {
      replaceState(_a, _b, url) {
        window.location.href = String(url);
      },
    },
  };
  const { useLearningSession } = loader(
    { window },
    { react: hooks, "@/lib/client/fetch": { fetchAPI, ApiError } },
  )("hooks/useLearningSession.ts");
  return {
    render() {
      cursor = 0;
      return useLearningSession(source);
    },
    ApiError,
  };
}
test("live controller resumes a server attempt and sends choices, navigation and notes to the API", async () => {
  const calls = [];
  let server = structuredClone(attempt);
  const h = hookHarness(async (url, method, body) => {
    calls.push({ url, method, body });
    if (method === "GET") return server;
    assert.equal(url, "/api/learning/attempts/attempt-server/answers");
    const update = body.updates[0];
    server = {
      ...server,
      savedAnswers: [{ ...server.savedAnswers[0], ...update, version: 9 }],
    };
    return { attempt: server };
  });
  let s = h.render();
  await s.resume(attempt.attemptId);
  s = h.render();
  assert.equal(s.attempt.title, attempt.title);
  s.setMemo(q.attemptQuestionId, "새 메모");
  await s.writeAnswers(
    q.attemptQuestionId,
    { selectedChoiceId: "opaque-B" },
    q.attemptQuestionId,
  );
  s = h.render();
  assert.equal(s.attempt.savedAnswers[0].selectedChoiceId, "opaque-B");
  assert.deepEqual(normal(s.memos), {});
  assert.equal(calls[1].body.updates[0].expectedVersion, 8);
  assert.equal(calls[1].body.updates[0].memo, "새 메모");
  assert.equal(calls[1].body.currentQuestionId, q.attemptQuestionId);
});
test("uncertain section submission retries the exact body and does not produce local results", async () => {
  const bodies = [];
  const h = hookHarness(async (url, method, body) => {
    if (method === "GET") return attempt;
    bodies.push(body);
    if (bodies.length === 1) throw new TypeError("offline");
    return {
      attempt: {
        ...attempt,
        state: "COMPLETED",
        resultAvailable: false,
        savedAnswers: [],
        currentSectionQuestions: [],
      },
    };
  });
  let s = h.render();
  await s.resume(attempt.attemptId);
  s = h.render();
  s.setMemo(q.attemptQuestionId, "최종 메모");
  assert.equal(await s.submitSection(), false);
  s = h.render();
  assert.equal(s.pending, true);
  assert.equal(s.result, null);
  await s.retry();
  s = h.render();
  assert.equal(bodies[0], bodies[1]);
  assert.equal(bodies[0].expectedSectionVersion, 3);
  assert.equal(bodies[0].finalUpdates[0].memo, "최종 메모");
  assert.equal(s.attempt.state, "COMPLETED");
  assert.equal(s.result, null);
  assert.deepEqual(normal(s.memos), {});
  assert.equal(await s.leave(), true);
});
test("handcrafted grading uses the server explanation and latest answer version", async () => {
  const real = { ...attempt, source: "HANDCRAFTED" };
  const calls = [];
  const grade = {
    outcome: "CORRECT",
    correctChoiceId: "opaque-A",
    explanation: "서버에서 공개한 해설",
    choices: [],
  };
  const h = hookHarness(async (url, method, body) => {
    calls.push({ url, method, body });
    return method === "GET"
      ? real
      : {
          attempt: {
            ...real,
            savedAnswers: [{ ...a, finalized: true, version: 9 }],
          },
          grade,
        };
  }, "HANDCRAFTED");
  let s = h.render();
  await s.resume(real.attemptId);
  s = h.render();
  await s.grade(false);
  s = h.render();
  assert.equal(calls[1].body.expectedVersion, 8);
  assert.equal(calls[1].body.selectedChoiceId, "opaque-A");
  assert.equal(s.grades[q.attemptQuestionId].explanation, grade.explanation);
});

const componentLoad = (overrides = {}) =>
  loader(
    {},
    {
      "lucide-react": new Proxy(
        {},
        {
          get: () => (props) => React.createElement("svg", props),
        },
      ),
      "next/dynamic": () => () => null,
      "next/link": ({ children, ...props }) =>
        React.createElement("a", props, children),
      "@/components/molecules": {
        AppShell: ({ children }) => React.createElement("div", null, children),
        PracticeHeader: ({ title, rightSlot }) =>
          React.createElement("header", null, title, rightSlot),
      },
      "@/app/(questionbank)/questionbank/handcrafted/_components/HandcraftedTutorial":
        () => null,
      ...overrides,
    },
  );
const baseSession = {
  source: "CBT",
  catalog: null,
  attempt,
  result: null,
  grades: {},
  history: [],
  cursor: null,
  bookmarks: {},
  memos: {},
  busy: false,
  loading: false,
  error: "",
  remaining: 120,
  index: 0,
  pending: false,
  disabled: false,
};
test("CBT live screen renders legacy question pane, answer sheet and tools with server content only", () => {
  const View = componentLoad()(
    "components/learning/practice/CbtPractice.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(View, { session: baseSession }),
  );
  for (const value of [
    q.stem,
    "답안 표기란",
    "계산기",
    "글자 크기",
    "문제 화면 배치",
    "답안 제출",
    "서버 선택지 A",
  ])
    assert.ok(html.includes(value), value);
  assert.ok(html.includes(q.media[0].downloadUrl));
  assert.equal(html.includes("350문항"), false);
  assert.equal(html.includes("서버에서 공개한 해설"), false);
});
test("handcrafted live screen retains numbered choices and progress and hides unreleased explanations", () => {
  const View = componentLoad()(
    "components/learning/practice/HandcraftedPractice.tsx",
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(View, {
      session: {
        ...baseSession,
        source: "HANDCRAFTED",
        attempt: { ...attempt, source: "HANDCRAFTED" },
      },
    }),
  );
  for (const value of [q.stem, "Q1", "모르겠어요", "채점하기", "임상약학"])
    assert.ok(html.includes(value), value);
  assert.equal(html.includes("정답 해설"), false);
});

function handcraftedView(session) {
  const effects = [];
  const View = componentLoad({
    react: {
      ...React,
      useState: (initial) => [initial, () => {}],
      useEffect: (effect) => effects.push(effect),
    },
  })("components/learning/practice/HandcraftedPractice.tsx").default;
  const tree = View({ session });
  const nodes = (element) => {
    if (Array.isArray(element)) return element.flatMap(nodes);
    if (!element || typeof element !== "object") return [];
    return [element, ...nodes(element.props?.children)];
  };
  return {
    tree,
    nodes: nodes(tree),
    runEffects: () => effects.forEach((f) => f()),
  };
}

test("completed handcrafted grading, submission and resumption return to setup even without questions", async () => {
  for (const action of ["grade", "submitSection", "resume"]) {
    const real = { ...attempt, source: "HANDCRAFTED" };
    const completed = {
      ...real,
      state: "COMPLETED",
      resultAvailable: true,
      currentSectionQuestions: [],
      savedAnswers: [],
    };
    const calls = [];
    const h = hookHarness(async (url, method) => {
      calls.push({ url, method });
      if (url === "/api/learning/attempts")
        return { items: [], nextCursor: null };
      if (method === "GET") return action === "resume" ? completed : real;
      return { attempt: completed };
    }, "HANDCRAFTED");
    await h.render().resume(real.attemptId);
    if (action !== "resume") await h.render()[action](false);
    const session = { ...h.render(), loading: false };
    assert.equal(session.attempt.state, "COMPLETED");
    const view = handcraftedView(session);
    assert.equal(
      renderToStaticMarkup(view.tree).includes(
        "현재 문제 또는 답안을 찾지 못하였습니다.",
      ),
      false,
    );
    view.runEffects();
    await new Promise(setImmediate);
    assert.equal(h.render().attempt, null);
    assert.equal(h.render().result, null);
    assert.equal(
      calls.some(({ url }) => url.endsWith("/result")),
      false,
    );
  }
});

test("missing handcrafted questions or answers show the exception and return button only", async () => {
  for (const missing of ["currentSectionQuestions", "savedAnswers"]) {
    let leaves = 0;
    const view = handcraftedView({
      ...baseSession,
      source: "HANDCRAFTED",
      attempt: { ...attempt, source: "HANDCRAFTED", [missing]: [] },
      leave: async () => {
        leaves++;
      },
    });
    view.runEffects();
    assert.equal(leaves, 0);
    const html = renderToStaticMarkup(view.tree);
    assert.ok(html.includes("현재 문제 또는 답안을 찾지 못하였습니다."));
    assert.equal(html.includes("응시 내용을 확인해주세요."), false);
    const back = view.nodes.find(
      (node) => node.type === "button" && node.props.children === "돌아가기",
    );
    assert.ok(back);
    back.props.onClick();
    assert.equal(leaves, 1);
  }
});

test("handcrafted completion waits for pending work and ignores result publication status", () => {
  for (const resultAvailable of [true, false]) {
    let leaves = 0;
    const session = {
      ...baseSession,
      source: "HANDCRAFTED",
      attempt: {
        ...attempt,
        source: "HANDCRAFTED",
        state: "COMPLETED",
        resultAvailable,
      },
      leave: async () => {
        leaves++;
      },
    };
    handcraftedView({ ...session, disabled: true }).runEffects();
    assert.equal(leaves, 0);
    handcraftedView(session).runEffects();
    assert.equal(leaves, 1);
  }
});
