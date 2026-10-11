import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(source, dependencies = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(source, import.meta.url), "utf8"),
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
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function setup({ result = { success: true }, error } = {}) {
  const calls = [];
  const signup = loadModule("../constants/signup.ts");
  const api = loadModule("../app/api/profile/personal-info/route.ts", {
    "next/server": {
      NextResponse: {
        json: (body, options) => ({ body, status: options?.status ?? 200 }),
      },
    },
    "@/constants/signup": signup,
    "@/lib/server/fetch": {
      serverFetch: async (endpoint, options) => {
        calls.push({ endpoint, options });
        if (error !== undefined) throw error;
        return result;
      },
    },
  });
  return { api, calls, signup };
}

const validValues = (overrides = {}) => ({
  realName: "홍길동",
  nickname: "약챗123",
  grade: "1학년",
  university: "약챗대학교",
  signupSource: "친구/지인 추천",
  ...overrides,
});
const requestWithBody = (body) => ({
  cookies: { get: () => ({ value: "test-session" }) },
  json: async () => body,
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test("GET forwards the authenticated request to the personal-info endpoint and preserves the backend response", async () => {
  const result = { data: validValues(), metadata: { revision: 2 } };
  const { api, calls } = setup({ result });
  const request = requestWithBody(null);
  const response = await api.GET(request);
  assert.equal(response.status, 200);
  assert.equal(response.body, result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].endpoint, "/api/profile/personal-info");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.request, request);
});

test("PUT forwards all five normalized signup fields and ignores other UI values", async () => {
  const result = { updated: true, data: validValues() };
  const { api, calls } = setup({ result });
  const request = requestWithBody({
    ...validValues({
      realName: "  홍길동  ",
      nickname: "  약챗123  ",
      university: "  약챗대학교  ",
    }),
    gender: "female",
    birthDate: "2000-01-01",
    password: "must-not-be-forwarded",
  });
  const response = await api.PUT(request);
  assert.equal(response.status, 200);
  assert.equal(response.body, result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].endpoint, "/api/profile/personal-info");
  assert.equal(calls[0].options.method, "PUT");
  assert.equal(calls[0].options.request, request);
  assert.deepEqual(plain(calls[0].options.data), validValues());
});

test("PUT accepts an omitted, null, empty, or whitespace-only optional university", async () => {
  const { university: _university, ...withoutUniversity } = validValues();
  const bodies = [
    withoutUniversity,
    validValues({ university: null }),
    validValues({ university: "" }),
    validValues({ university: " \t " }),
  ];
  for (const body of bodies) {
    const { api, calls } = setup();
    assert.equal((await api.PUT(requestWithBody(body))).status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.data.university, "");
  }
});

test("PUT accepts each current signup grade and signup source", async () => {
  const { api, calls, signup } = setup();
  assert.equal(signup.SIGNUP_GRADE_OPTIONS.length, 9);
  assert.equal(signup.SIGNUP_SOURCE_OPTIONS.length, 8);
  for (const grade of signup.SIGNUP_GRADE_OPTIONS) {
    assert.equal(
      (await api.PUT(requestWithBody(validValues({ grade })))).status,
      200,
      grade,
    );
    assert.equal(calls.at(-1).options.data.grade, grade);
  }
  for (const signupSource of signup.SIGNUP_SOURCE_OPTIONS) {
    assert.equal(
      (await api.PUT(requestWithBody(validValues({ signupSource })))).status,
      200,
      signupSource,
    );
    assert.equal(calls.at(-1).options.data.signupSource, signupSource);
  }
  assert.equal(calls.length, 17);
});

test("PUT accepts the name, nickname, and university length boundaries", async () => {
  for (const nickname of ["가A", "A".repeat(50)]) {
    const { api, calls } = setup();
    const values = validValues({
      realName: "홍".repeat(50),
      nickname,
      university: "학".repeat(255),
    });
    assert.equal((await api.PUT(requestWithBody(values))).status, 200);
    assert.deepEqual(plain(calls[0].options.data), values);
  }
});

test("PUT rejects invalid fields before contacting the backend", async (t) => {
  const invalidCases = [
    ["missing real name", { realName: undefined }],
    ["blank real name", { realName: " \t " }],
    ["non-string real name", { realName: 123 }],
    ["real name longer than 50 characters", { realName: "홍".repeat(51) }],
    ["blank nickname", { nickname: " " }],
    ["one-character nickname", { nickname: "약" }],
    ["nickname longer than 50 characters", { nickname: "A".repeat(51) }],
    ["nickname with spaces", { nickname: "약 챗" }],
    ["nickname with punctuation", { nickname: "약챗!" }],
    ["non-string nickname", { nickname: 123 }],
    ["unknown grade", { grade: "7학년" }],
    ["missing grade", { grade: undefined }],
    ["non-string grade", { grade: 1 }],
    ["unknown signup source", { signupSource: "검색엔진" }],
    ["missing signup source", { signupSource: undefined }],
    ["non-string signup source", { signupSource: 1 }],
    ["university longer than 255 characters", { university: "학".repeat(256) }],
    ["non-string university", { university: 123 }],
  ];
  for (const [label, overrides] of invalidCases) {
    await t.test(label, async () => {
      const { api, calls } = setup();
      const response = await api.PUT(requestWithBody(validValues(overrides)));
      assert.equal(response.status, 400);
      assert.equal(typeof response.body.message, "string");
      assert.ok(response.body.message.length > 0);
      assert.equal(calls.length, 0);
    });
  }
});

test("PUT rejects non-object bodies and malformed JSON without contacting the backend", async () => {
  for (const body of [[], null, "invalid", 123]) {
    const { api, calls } = setup();
    const response = await api.PUT(requestWithBody(body));
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "입력 정보를 확인해주세요.");
    assert.equal(calls.length, 0);
  }
  const { api, calls } = setup();
  const response = await api.PUT({
    json: async () => {
      throw new SyntaxError("Unexpected end of JSON input");
    },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "입력 정보를 확인해주세요.");
  assert.equal(calls.length, 0);
});

test("GET and PUT preserve structured backend authentication and conflict errors", async () => {
  for (const method of ["GET", "PUT"]) {
    for (const [status, message] of [
      [401, "로그인이 필요합니다."],
      [409, "이미 사용 중인 닉네임입니다."],
    ]) {
      const { api, calls } = setup({
        error: new Error(JSON.stringify({ status, message })),
      });
      const response = await api[method](requestWithBody(validValues()));
      assert.equal(response.status, status);
      assert.equal(response.body.message, message);
      assert.equal(calls.length, 1);
    }
  }
});

test("GET and PUT return status 500 for unexpected backend failures", async () => {
  for (const method of ["GET", "PUT"]) {
    const { api, calls } = setup({ error: new Error("Unexpected failure") });
    const response = await api[method](requestWithBody(validValues()));
    assert.equal(response.status, 500);
    assert.equal(response.body.message, "Unexpected failure");
    assert.equal(calls.length, 1);

    const { api: fallbackApi } = setup({ error: "unexpected rejection" });
    const fallback = await fallbackApi[method](requestWithBody(validValues()));
    assert.equal(fallback.status, 500);
    assert.equal(fallback.body.message, "맞춤형 정보를 처리하지 못했습니다.");
  }
});
