import assert from "node:assert/strict";
import test from "node:test";
import { loader, storage, jwt } from "./helpers/load-ts.mjs";
import { NextRequest } from "next/server.js";
const json = (data, status = 200) => Response.json(data, { status });
function browser(fetch) {
  const window = {
    localStorage: storage(),
    sessionStorage: storage(),
    dispatchEvent() {},
  };
  const load = loader({ window, document: { cookie: "" }, fetch });
  return { load, api: load("lib/client/fetch.ts"), window };
}

test("legacy and current clients share one refresh and rotate both tokens", async () => {
  let refreshes = 0;
  const { api, load } = browser(async (url) => {
    if (url.includes("refresh-token")) {
      refreshes++;
      await new Promise((r) => setTimeout(r, 10));
      return json({
        success: true,
        data: { access_token: jwt(), refresh_token: "new-refresh" },
      });
    }
    return json({ ok: true });
  });
  api.setTokens(jwt("1", -60), "old-refresh", false);
  const legacy = load("lib/functions/fetchData.ts");
  await Promise.all([
    api.fetchAPI("/api/private", "GET"),
    legacy.fetchAPI("/api/other", "GET"),
  ]);
  assert.equal(refreshes, 1);
  assert.equal(api.getRefreshToken(), "new-refresh");
});

test("503 and network refresh failures preserve credentials", async () => {
  for (const fetch of [
    async () => json({ message: "Unavailable" }, 503),
    async () => {
      throw new TypeError("offline");
    },
  ]) {
    const { api } = browser(fetch);
    api.setTokens(jwt(), "retained");
    assert.equal(await api.refreshTokens(), false);
    assert.equal(api.getRefreshToken(), "retained");
  }
});

test("old failed refresh cannot erase a newer login", async () => {
  let resolve;
  const { api } = browser(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  api.setTokens(jwt("old"), "old");
  const pending = api.refreshTokens();
  api.setTokens(jwt("new"), "new");
  resolve(json({ code: "SESSION_REVOKED" }, 401));
  await pending;
  assert.equal(api.getRefreshToken(), "new");
});

test("missing rotated refresh token is never replaced with the consumed token", async () => {
  const { api } = browser(async () =>
    json({ success: true, data: { access_token: jwt("2") } }),
  );
  api.setTokens(jwt("1"), "original");
  assert.equal(await api.refreshTokens(), false);
  assert.equal(api.getToken(), jwt("1"));
});

test("403 never refreshes, and status/code survive the client", async () => {
  let calls = 0;
  const { api } = browser(async () => {
    calls++;
    return json({ code: "FORBIDDEN", message: "권한 없음" }, 403);
  });
  api.setTokens(jwt(), "refresh");
  await assert.rejects(
    api.fetchAPI("/api/private", "GET"),
    (e) => e.status === 403 && e.code === "FORBIDDEN",
  );
  assert.equal(calls, 1);
});

test("public auth errors do not trigger refresh", async () => {
  const calls = [];
  const { api } = browser(async (url) => {
    calls.push(url);
    return json({ code: "BAD_CODE" }, 401);
  });
  api.setTokens(jwt("1", -60), "refresh");
  await assert.rejects(
    api.fetchAPI("/api/auth/password-reset/verify", "POST", {}),
  );
  assert.deepEqual(calls, ["/api/auth/password-reset/verify"]);
});

test("empty 200, 204, numeric JSON and plain text are all supported", async () => {
  for (const [response, expected] of [
    [new Response(null, { status: 204 }), null],
    [new Response(""), null],
    [json(8), 8],
    [new Response("email sent"), "email sent"],
  ]) {
    const { api } = browser(async () => response);
    assert.equal(
      await api.fetchAPI("/api/auth/password-reset/send", "POST", {}),
      expected,
    );
  }
});

test("learning retries preserve opaque IDs, expectedVersion, body and UUID", async () => {
  const bodies = [];
  const { load } = browser(async (_url, options) => {
    bodies.push(options.body);
    if (bodies.length === 1) throw new TypeError("lost response");
    return json({ attempt: { attemptId: "9007199254740999" } });
  });
  const { LearningCommands } = load("lib/learning/api.ts");
  const commands = new LearningCommands();
  await assert.rejects(
    commands.send("/api/learning/attempts/9007199254740999/answers", "PUT", {
      updates: [{ attemptQuestionId: "9007199254741001", expectedVersion: 3 }],
    }),
  );
  await assert.rejects(commands.send("/another", "POST", {}));
  const result = await commands.retry();
  assert.equal(bodies[0], bodies[1]);
  assert.equal(result.attempt.attemptId, "9007199254740999");
  assert.match(JSON.parse(bodies[0]).idempotencyKey, /^[\da-f-]{36}$/);
  assert.equal(commands.pending, null);
});

test("409 clears stale command so a new version needs a new command", async () => {
  const { load } = browser(async () =>
    json({ code: "STALE_ANSWER_VERSION" }, 409),
  );
  const { LearningCommands } = load("lib/learning/api.ts");
  const commands = new LearningCommands();
  await assert.rejects(commands.send("/api/learning/test", "PUT", {}));
  assert.equal(commands.pending, null);
});

const routeLoader = (fetch) =>
  loader({
    fetch,
    process: { env: { NEXT_PUBLIC_API_HOST: "http://backend.test" } },
  });
const request = (path, method = "GET", body, headers = {}) =>
  new NextRequest(`http://frontend.test${path}`, {
    method,
    headers: {
      ...headers,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

test("BFF preserves 409 code, query, bearer, no-store and large IDs", async () => {
  let upstream;
  const load = routeLoader(async (url, options) => {
    upstream = { url, options };
    return json(
      { code: "STALE_ANSWER_VERSION", message: "최신 답안 필요" },
      409,
    );
  });
  const { backendProxy } = load("lib/server/backendProxy.ts");
  const response = await backendProxy(
    request(
      "/api/learning/attempts/9007199254740999?before=opaque%3A42",
      "GET",
      null,
      { authorization: "Bearer access" },
    ),
  );
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "STALE_ANSWER_VERSION");
  assert.match(upstream.url, /9007199254740999\?before=opaque%3A42$/);
  assert.equal(upstream.options.headers.get("authorization"), "Bearer access");
  assert.equal(upstream.options.cache, "no-store");
});

test("BFF preserves 204, plain text and multipart boundary", async () => {
  const form = new FormData();
  form.append(
    "metadata",
    new Blob(['{"idempotencyKey":"test"}'], { type: "application/json" }),
  );
  form.append("file", new Blob(["data"]), "source.txt");
  let forwarded;
  const load = routeLoader(async (_url, options) => {
    forwarded = options;
    return new Response(null, { status: 204 });
  });
  const req = new NextRequest("http://frontend.test/api/flashcards/sources", {
    method: "POST",
    body: form,
  });
  const originalType = req.headers.get("content-type");
  const response = await load("lib/server/backendProxy.ts").backendProxy(req);
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(forwarded.headers.get("content-type"), originalType);
  assert.ok(forwarded.body.byteLength > 0);
});

test("email verify proxy returns the one-use proof", async () => {
  const load = routeLoader(async () => json({ verificationToken: "proof" }));
  const response = await load("app/api/auth/check-verify/route.ts").POST(
    request("/api/auth/check-verify", "POST", {
      email: "test@example.com",
      code: "123456",
    }),
  );
  assert.equal((await response.json()).verificationToken, "proof");
});

test("manual registration and password reset forward their distinct proof tokens", async () => {
  const bodies = [];
  const load = routeLoader(async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return json({ access_token: "access", refresh_token: "refresh" });
  });
  const signup = {
    nickname: "테스트",
    email: "test@example.com",
    password: "not-a-real-password",
    agreeToTerms: true,
    realName: "테스트",
    documentType: "student",
    grade: "3학년",
    signupSource: "학교",
    emailVerificationToken: "signup-proof",
  };
  const first = await load("app/api/auth/submit-manual/route.ts").POST(
    request("/api/auth/submit-manual", "POST", signup),
  );
  assert.equal(first.status, 200);
  assert.equal(bodies[0].emailVerificationToken, "signup-proof");
  const second = await load("app/api/auth/password-reset/route.ts").POST(
    request("/api/auth/password-reset", "POST", {
      email: signup.email,
      newPassword: "new-password",
      resetToken: "reset-proof",
    }),
  );
  assert.equal(second.status, 200);
  assert.equal(bodies[1].resetToken, "reset-proof");
});

test("AI reveal action is forwarded without userAnswer and recovery uses quiz GET", async () => {
  const calls = [];
  const load = routeLoader(async (url, options) => {
    calls.push({ url, options });
    return json({});
  });
  const route = load("app/api/questionbank/quiz/[sessionId]/route.ts");
  const params = { params: Promise.resolve({ sessionId: "9007199254740999" }) };
  await route.POST(
    request("/api/questionbank/quiz/test", "POST", {
      action: "REVEAL",
      questionId: 3,
      idempotencyKey: "key",
    }),
    params,
  );
  assert.equal(JSON.parse(calls[0].options.body).action, "REVEAL");
  assert.equal(JSON.parse(calls[0].options.body).userAnswer, undefined);
  await route.GET(request("/api/questionbank/quiz/test?resume=true"), params);
  assert.equal(calls[1].url, "http://backend.test/api/quiz/9007199254740999");
});

test("SYSTEM push explicitly separates ALL and USERS, preserving caller UUID", async () => {
  const bodies = [];
  const load = routeLoader(async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return json({ jobId: "1" });
  });
  const { enqueueAdminPushJob } = load("app/api/push/_pushJob.ts");
  const req = request("/api/push/send", "POST", {});
  await enqueueAdminPushJob(req, {
    audience: "ALL",
    idempotencyKey: "uuid",
    title: "title",
    content: "body",
  });
  await enqueueAdminPushJob(req, {
    audience: "USERS",
    idempotencyKey: "uuid2",
    title: "title",
    content: "body",
    userIds: [12],
  });
  assert.equal(bodies[0].jobType, "SYSTEM");
  assert.equal(bodies[0].audience, "ALL");
  assert.equal("targetUserIds" in bodies[0], false);
  assert.equal(bodies[0].idempotencyKey, "uuid");
  assert.deepEqual(bodies[1].targetUserIds, [12]);
});

test("blind masks use server width/height and wrong-note flags map correctly", async () => {
  let form;
  const { api, load } = browser(async (_url, options) => {
    form = options.body;
    return json({ id: 1, type: "BLIND" });
  });
  api.setTokens(jwt(), "refresh");
  await load("lib/flashcards/api.ts").createRemoteFlashcard({
    type: "blind",
    title: "test",
    imageFile: new Blob(["image"]),
    imageUrl: "",
    masks: [{ id: "1", x: 0, y: 0, width: 0.2, height: 0.3 }],
  });
  const mask = JSON.parse(form.get("masks"))[0];
  assert.equal(mask.width, 0.2);
  assert.equal(mask.height, 0.3);
  assert.equal(mask.w, undefined);
  const { mapWrongNoteResponse } = load("lib/server/wrongNoteResponse.ts");
  const mapped = mapWrongNoteResponse({ owner: true, liked: false });
  assert.equal(mapped.isOwner, true);
  assert.equal(mapped.isLiked, false);
});

test("401 retries a protected request once with the identical body", async () => {
  const bodies = [];
  let calls = 0;
  let refreshes = 0;
  const { api } = browser(async (url, options) => {
    if (url.includes("refresh-token")) {
      refreshes++;
      return json({
        success: true,
        data: { access_token: jwt("1", 7200), refresh_token: "rotated" },
      });
    }
    calls++;
    bodies.push(options.body);
    return calls === 1
      ? json({ code: "TOKEN_EXPIRED" }, 401)
      : json({ saved: true });
  });
  api.setTokens(jwt(), "original");
  await api.fetchAPI("/api/learning/attempts/42/answers", "PUT", {
    idempotencyKey: "same-key",
    updates: [],
  });
  assert.equal(refreshes, 1);
  assert.equal(calls, 2);
  assert.equal(bodies[0], bodies[1]);
});

test("a refresh 503 prevents sending an anonymous mutation or retrying refresh again", async () => {
  const calls = [];
  const { api } = browser(async (url) => {
    calls.push(url);
    return json({ code: "AUTH_STORE_UNAVAILABLE" }, 503);
  });
  api.setTokens(jwt("1", -60), "retained");
  await assert.rejects(
    api.fetchAPI("/api/learning/cbt/attempts", "POST", {}),
    (e) => e.status === 503,
  );
  assert.deepEqual(calls, ["/api/auth/refresh-token"]);
  assert.equal(api.getRefreshToken(), "retained");
});

test("a successful old refresh cannot overwrite another tab's login", async () => {
  let resolve;
  const { api, window } = browser(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  api.setTokens(jwt("old"), "old");
  const pending = api.refreshTokens();
  window.localStorage.setItem("access_token", jwt("new"));
  window.localStorage.setItem("refresh_token", "new-session");
  resolve(
    json({
      success: true,
      data: { access_token: jwt("old"), refresh_token: "old-rotated" },
    }),
  );
  await pending;
  assert.equal(api.getRefreshToken(), "new-session");
  assert.equal(api.getToken(), jwt("new"));
});

test("notification bulk commands preserve snapshot strings end to end", async () => {
  let upstream;
  const load = routeLoader(async (url, options) => {
    upstream = { url, body: new TextDecoder().decode(options.body) };
    return new Response(null, { status: 204 });
  });
  const { backendProxy } = load("lib/server/backendProxy.ts");
  const response = await backendProxy(
    request("/api/notifications/read-all", "PATCH", {
      throughSequence: "9007199254740999",
    }),
  );
  assert.equal(response.status, 204);
  assert.equal(JSON.parse(upstream.body).throughSequence, "9007199254740999");
});
