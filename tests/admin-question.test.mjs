import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(path, dependencies = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  );
  vm.runInNewContext(outputText, {
    exports,
    Error,
    crypto: { randomUUID },
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports;
}

const questions = loadModule("../lib/admin/questions.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

function validQuestion(id = "question-1") {
  return {
    id,
    subject: "생명약학",
    topic: "약리학",
    subtopic: "자율신경계",
    prompt: "무스카린 수용체를 차단하는 약물은?",
    referenceContent: "환자에게 산동이 관찰되었다.",
    choices: [
      { id: `${id}-a`, text: "아트로핀", explanation: "무스카린 길항제이다." },
      {
        id: `${id}-b`,
        text: "필로카르핀",
        explanation: "무스카린 작용제이다.",
      },
    ],
    correctChoiceId: `${id}-a`,
    explanation: "아트로핀은 무스카린 수용체 길항제이다.",
    isActive: true,
  };
}

function validSet(overrides = {}) {
  return {
    version: 1,
    title: "자율신경계 문제 세트",
    kind: "HANDCRAFTED",
    sessionId: 1,
    durationMinutes: 90,
    isActive: true,
    questions: [validQuestion()],
    ...overrides,
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test("new drafts use fresh platform UUIDs and allow incomplete editing", () => {
  const first = questions.createQuestionSet();
  const second = questions.createQuestionSet();
  const ids = [first, second].flatMap((set) =>
    set.questions.flatMap((question) => [
      question.id,
      ...question.choices.map((choice) => choice.id),
    ]),
  );
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^[0-9a-f-]{36}$/i));
  assert.deepEqual(plain(questions.parseQuestionSet(first)), plain(first));
  assert.match(questions.validateQuestionSet(first), /세트명/);
  first.questions[0].choices[0].text = "첫 초안만 변경";
  assert.equal(second.questions[0].choices[0].text, "");
});

test("complete handcrafted and CBT sets validate with optional reference and subtopic empty", () => {
  for (const kind of ["HANDCRAFTED", "CBT"]) {
    const set = validSet({ kind });
    set.questions[0].subtopic = "";
    set.questions[0].referenceContent = "";
    assert.equal(questions.validateQuestionSet(set), null);
    assert.deepEqual(plain(questions.parseQuestionSet(set)), set);
  }
});

test("import strips unexpected set, question, and choice fields without changing the input", () => {
  const set = validSet();
  set.adminId = "cannot-trust-import";
  set.questions[0].answer = 4;
  set.questions[0].choices[0].isCorrect = false;
  const before = plain(set);
  const parsed = questions.parseQuestionSet(deepFreeze(set));
  assert.deepEqual(plain(parsed), validSet());
  assert.deepEqual(set, before);
  assert.notEqual(parsed.questions[0], set.questions[0]);
  assert.notEqual(parsed.questions[0].choices, set.questions[0].choices);
});

test("normalization trims authored text at every level and preserves stable identifiers", () => {
  const set = validSet();
  set.title = ` \t${set.title}\n `;
  for (const key of [
    "subject",
    "topic",
    "subtopic",
    "prompt",
    "referenceContent",
    "explanation",
  ]) {
    set.questions[0][key] = ` \t${set.questions[0][key]}\n `;
  }
  set.questions[0].choices.forEach((choice) => {
    choice.text = ` \t${choice.text}\n `;
    choice.explanation = ` \t${choice.explanation}\n `;
  });
  const before = plain(set);
  const normalized = questions.normalizeQuestionSet(deepFreeze(set));
  assert.deepEqual(plain(normalized), validSet());
  assert.deepEqual(set, before);
  assert.equal(questions.validateQuestionSet(normalized), null);
});

test("publication rejects whitespace-only required text and choices equal after trimming", async (t) => {
  const cases = [
    ["title", (set) => (set.title = " \t ")],
    ...["subject", "topic", "prompt", "explanation"].map((key) => [
      key,
      (set) => (set.questions[0][key] = " \n "),
    ]),
    ["choice text", (set) => (set.questions[0].choices[0].text = " \t ")],
    [
      "choice explanation",
      (set) => (set.questions[0].choices[1].explanation = " \t "),
    ],
    [
      "duplicate choice text",
      (set) => (set.questions[0].choices[1].text = " 아트로핀 "),
    ],
    [
      "missing correct choice",
      (set) => (set.questions[0].correctChoiceId = ""),
    ],
  ];
  for (const [label, mutate] of cases) {
    await t.test(label, () => {
      const set = validSet();
      mutate(set);
      assert.doesNotThrow(() => questions.parseQuestionSet(set));
      assert.equal(typeof questions.validateQuestionSet(set), "string");
    });
  }
});

test("import rejects invalid JSON values and missing or wrongly typed nested fields", () => {
  for (const value of [null, undefined, [], "{malformed JSON", 1, true]) {
    assert.throws(() => questions.parseQuestionSet(value), Error);
  }
  for (const mutate of [
    (set) => delete set.title,
    (set) => (set.title = 1),
    (set) => (set.isActive = "true"),
    (set) => (set.questions = {}),
    (set) => (set.questions[0] = null),
    (set) => delete set.questions[0].referenceContent,
    (set) => (set.questions[0].isActive = 1),
    (set) => (set.questions[0].choices = {}),
    (set) => (set.questions[0].choices[0] = []),
    (set) => (set.questions[0].choices[0].text = null),
    (set) => delete set.questions[0].choices[0].explanation,
    (set) => (set.questions[0].correctChoiceId = 0),
  ]) {
    const set = validSet();
    mutate(set);
    assert.throws(() => questions.parseQuestionSet(set), Error);
    assert.equal(typeof questions.validateQuestionSet(set), "string");
  }
});

test("import requires a supported version, kind, integer session, and bounded integer duration", () => {
  for (const overrides of [
    { version: 2 },
    { version: "1" },
    { kind: "AI" },
    { sessionId: 0 },
    { sessionId: 5 },
    { sessionId: 1.5 },
    { sessionId: "1" },
    { durationMinutes: 0 },
    { durationMinutes: 241 },
    { durationMinutes: 1.5 },
    { durationMinutes: "90" },
    { durationMinutes: Number.NaN },
  ]) {
    assert.throws(() => questions.parseQuestionSet(validSet(overrides)), Error);
  }
  for (const sessionId of [1, 2, 3, 4]) {
    for (const durationMinutes of [1, 240]) {
      assert.equal(
        questions.validateQuestionSet(validSet({ sessionId, durationMinutes })),
        null,
      );
    }
  }
});

test("question and choice counts accept their boundaries and reject empty or oversized sets", () => {
  for (const count of [1, 100]) {
    const set = validSet({
      questions: Array.from({ length: count }, (_, index) =>
        validQuestion(`q-${index}`),
      ),
    });
    assert.equal(questions.validateQuestionSet(set), null);
  }
  for (const count of [0, 101]) {
    assert.throws(
      () =>
        questions.parseQuestionSet(
          validSet({
            questions: Array.from({ length: count }, (_, index) =>
              validQuestion(`q-${index}`),
            ),
          }),
        ),
      Error,
    );
  }
  for (const count of [1, 2, 5, 6]) {
    const set = validSet();
    set.questions[0].choices = Array.from({ length: count }, (_, index) => ({
      id: `question-1-${index}`,
      text: `보기 ${index}`,
      explanation: `보기 해설 ${index}`,
    }));
    set.questions[0].correctChoiceId = "question-1-0";
    if (count < 2 || count > 5) {
      assert.throws(() => questions.parseQuestionSet(set), /2~5/);
    } else {
      assert.equal(questions.validateQuestionSet(set), null);
    }
  }
});

test("import rejects blank or duplicate question and choice IDs and an absent correct choice ID", () => {
  for (const mutate of [
    (set) => (set.questions[0].id = " \t "),
    (set) => set.questions.push(validQuestion()),
    (set) => (set.questions[0].choices[0].id = ""),
    (set) => (set.questions[0].choices[1].id = set.questions[0].choices[0].id),
    (set) => (set.questions[0].correctChoiceId = "another-question-choice"),
  ]) {
    const set = validSet();
    mutate(set);
    assert.throws(() => questions.parseQuestionSet(set), Error);
  }
});

test("active publication needs an active question while inactive sets retain completed questions", () => {
  const set = validSet();
  set.questions[0].isActive = false;
  assert.match(questions.validateQuestionSet(set), /활성 문제/);
  set.isActive = false;
  assert.equal(questions.validateQuestionSet(set), null);
  set.questions[0].explanation = "";
  assert.match(questions.validateQuestionSet(set), /해설/);
});

test("import accepts exact text limits and rejects fields exceeding those limits", async (t) => {
  const cases = [
    ["title", 100, (set) => set, "title"],
    ...["id", "subject", "topic", "subtopic"].map((key) => [
      key,
      100,
      (set) => set.questions[0],
      key,
    ]),
    ...["prompt", "referenceContent", "explanation"].map((key) => [
      key,
      10000,
      (set) => set.questions[0],
      key,
    ]),
    ["choice id", 100, (set) => set.questions[0].choices[1], "id"],
    ["choice text", 2000, (set) => set.questions[0].choices[0], "text"],
    [
      "choice explanation",
      10000,
      (set) => set.questions[0].choices[0],
      "explanation",
    ],
  ];
  for (const [label, max, target, key] of cases) {
    await t.test(label, () => {
      const set = validSet();
      target(set)[key] = "가".repeat(max);
      assert.doesNotThrow(() => questions.parseQuestionSet(set));
      target(set)[key] += "가";
      assert.throws(() => questions.parseQuestionSet(set), Error);
    });
  }
});

const NOW = 1_791_500_000_000;
const jwtJson = (json) =>
  `header.${Buffer.from(json).toString("base64url")}.signature`;
const jwt = (payload) => jwtJson(JSON.stringify(payload));

function setupAuth(initialToken, server = false) {
  let token = initialToken;
  const auth = loadModule(
    "../lib/client/auth.ts",
    {
      "@/lib/client/fetch": { getToken: () => token },
    },
    {
      ...(server ? {} : { window: {} }),
      atob: (value) => Buffer.from(value, "base64").toString("binary"),
      Date: class extends Date {
        static now() {
          return NOW;
        }
      },
      console: { error() {} },
    },
  );
  return {
    auth,
    setToken: (value) => {
      token = value;
    },
  };
}

const livePayload = (overrides = {}) => ({
  userId: 42,
  username: "관리자",
  exp: NOW / 1000 + 60,
  roles: ["ROLE_ADMIN"],
  ...overrides,
});

test("admin visibility supports existing exact role representations", () => {
  for (const role of [
    { role: "ROLE_ADMIN" },
    { auth: "ROLE_ADMIN" },
    { roles: ["ROLE_USER", "ROLE_ADMIN"] },
    { authorities: ["ROLE_ADMIN"] },
    { authorities: [{ authority: "ROLE_ADMIN" }] },
    { auth: "ROLE_USER, ROLE_ADMIN " },
  ]) {
    const { auth } = setupAuth(jwt(livePayload({ roles: [], ...role })));
    assert.equal(auth.isCurrentUserAdmin(), true);
  }
});

test("admin visibility rejects users, role substrings, missing tokens, and expired sessions", () => {
  for (const token of [
    null,
    "malformed-token",
    jwt(livePayload({ roles: ["ROLE_USER"] })),
    jwt(livePayload({ roles: [], role: "ADMIN" })),
    jwt(livePayload({ roles: [], auth: "ROLE_ADMIN_NOT" })),
    jwt(livePayload({ roles: [], auth: "ROLE_USER, ROLE_ADMIN_NOT" })),
    jwt(livePayload({ roles: ["ROLE_ADMIN_NOT"] })),
    jwt(livePayload({ exp: NOW / 1000 - 1 })),
    jwt(livePayload({ exp: NOW / 1000 })),
    jwt(livePayload({ exp: undefined })),
  ]) {
    const { auth } = setupAuth(token);
    assert.equal(auth.isCurrentUserAdmin(), false);
  }
});

test("admin visibility rejects nonnumeric and nonfinite expiration claims", () => {
  const tokens = [
    ...[
      Number.NaN,
      Infinity,
      -Infinity,
      "invalid",
      String(NOW / 1000 + 60),
    ].map((exp) => jwt(livePayload({ exp }))),
    // Valid JSON can decode to Infinity even though JSON.stringify serializes it as null.
    jwtJson(JSON.stringify(livePayload()).replace(/"exp":\d+/, '"exp":1e999')),
  ];
  for (const token of tokens) {
    const { auth } = setupAuth(token);
    assert.equal(auth.isCurrentUserAdmin(), false);
  }
});

test("user and admin queries follow the current token provider instead of stale local administrator data", () => {
  const { auth, setToken } = setupAuth(jwt(livePayload()));
  assert.equal(auth.isCurrentUserAdmin(), true);
  assert.equal(auth.getCurrentUserId(), "42");
  assert.equal(auth.getCurrentUserInfo().username, "관리자");
  setToken(jwt(livePayload({ userId: 7, roles: ["ROLE_USER"] })));
  assert.equal(auth.isCurrentUserAdmin(), false);
  assert.equal(auth.getCurrentUserId(), "7");
  assert.deepEqual(plain(auth.getCurrentUserInfo().roles), ["ROLE_USER"]);
  setToken(null);
  assert.equal(auth.getCurrentUserInfo(), null);
  assert.equal(auth.getCurrentUserId(), null);
});

test("server rendering never exposes browser identity or administrator controls", () => {
  const { auth } = setupAuth(jwt(livePayload()), true);
  assert.equal(auth.getCurrentUserInfo(), null);
  assert.equal(auth.getCurrentUserId(), null);
  assert.equal(auth.isCurrentUserAdmin(), false);
});

function setupAccess({ error, result = { message: "Admin Dashboard" } } = {}) {
  const calls = [];
  const api = loadModule("../app/api/admin/questions/access/route.ts", {
    "next/server": {
      NextResponse: {
        json: (body, options) => ({ body, status: options?.status ?? 200 }),
      },
    },
    "@/lib/server/fetch": {
      serverFetch: async (endpoint, options) => {
        calls.push({ endpoint, options });
        if (error !== undefined) throw error;
        return result;
      },
    },
  });
  return { api, calls };
}

function accessRequest({ authorization = null, cookie = null } = {}) {
  return {
    headers: {
      get: (name) => (name === "authorization" ? authorization : null),
    },
    cookies: {
      get: (name) =>
        name === "access_token" && cookie ? { value: cookie } : undefined,
    },
  };
}

test("admin access denies missing credentials without contacting the backend", async () => {
  for (const credentials of [{}, { authorization: "", cookie: "" }]) {
    const { api, calls } = setupAccess();
    const response = await api.GET(accessRequest(credentials));
    assert.equal(response.status, 401);
    assert.equal(response.body.isAdmin, undefined);
    assert.equal(calls.length, 0);
  }
});

test("admin access verifies header or cookie credentials through the existing protected backend", async () => {
  for (const credentials of [
    { authorization: "Bearer valid-admin-token" },
    { cookie: "valid-admin-cookie" },
    { authorization: "Bearer header-token", cookie: "cookie-token" },
  ]) {
    const { api, calls } = setupAccess();
    const request = accessRequest(credentials);
    const response = await api.GET(request);
    assert.equal(response.status, 200);
    assert.deepEqual(plain(response.body), { isAdmin: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].endpoint, "/api/admin/dashboard");
    assert.equal(calls[0].options.method, "GET");
    assert.equal(calls[0].options.request, request);
  }
});

test("admin access preserves backend authentication and authorization rejection", async () => {
  for (const status of [401, 403]) {
    const { api, calls } = setupAccess({
      error: new Error(
        JSON.stringify({ status, message: "Denied by backend" }),
      ),
    });
    const response = await api.GET(accessRequest({ cookie: "rejected-token" }));
    assert.equal(response.status, status);
    assert.equal(response.body.isAdmin, undefined);
    assert.match(response.body.message, /관리자/);
    assert.equal(calls.length, 1);
  }
});

test("backend rejection overrides a token that merely claims to be an administrator", async () => {
  const forgedToken = jwt(livePayload());
  const { auth } = setupAuth(forgedToken);
  assert.equal(auth.isCurrentUserAdmin(), true);
  const { api, calls } = setupAccess({
    error: new Error(
      JSON.stringify({ status: 401, message: "Invalid signature" }),
    ),
  });
  const request = accessRequest({ authorization: `Bearer ${forgedToken}` });
  const response = await api.GET(request);
  assert.equal(response.status, 401);
  assert.equal(response.body.isAdmin, undefined);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.request, request);
});

test("unavailable or unexpected backend authorization responses fail closed with status 503", async () => {
  for (const error of [
    new TypeError("fetch failed"),
    new Error(JSON.stringify({ status: 503, message: "Service unavailable" })),
    new Error(JSON.stringify({ status: 500 })),
    new Error(JSON.stringify({ status: 404 })),
    new Error("Unexpected failure"),
    new Error("null"),
    "unexpected rejection",
    null,
  ]) {
    const { api, calls } = setupAccess({ error });
    const response = await api.GET(
      accessRequest({ authorization: "Bearer admin-token" }),
    );
    assert.equal(response.status, 503);
    assert.equal(response.body.isAdmin, undefined);
    assert.match(response.body.message, /확인하지 못했습니다/);
    assert.equal(calls.length, 1);
  }
});
