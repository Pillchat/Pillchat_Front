import assert from "node:assert/strict";
import test from "node:test";
import { loader, storage, jwt } from "./helpers/load-ts.mjs";

const endpoint = "/api/auth/oauth/kakao/link";
const state = "server-issued-state";
const callback = "https://pillchat.test/settings/account/kakao/callback";
const unlinked = { provider: null, linked: false, canLink: true };
const linked = { provider: "kakao", linked: true, canLink: false };
const ok = (data) => Response.json({ success: true, data });

function setup({
  native = false,
  reply,
  nativeToken = async () => "kakao-token",
} = {}) {
  const calls = [];
  let assigned;
  const window = {
    sessionStorage: storage(),
    localStorage: storage(),
    dispatchEvent() {},
    location: {
      origin: "https://pillchat.test",
      assign: (url) => {
        assigned = url;
      },
    },
  };
  const load = loader(
    {
      window,
      document: { cookie: "" },
      AbortSignal,
      process: { env: { NEXT_PUBLIC_KAKAO_REST_API_KEY: "rest-key" } },
      fetch: async (url, init) => {
        calls.push({
          url,
          ...init,
          parsed: init.body ? JSON.parse(init.body) : undefined,
        });
        if (reply) {
          const response = await reply(url, init, calls);
          if (response !== undefined) return response;
        }
        if (url.endsWith("/start")) return ok({ state, expiresIn: 600 });
        return ok(init.method === "GET" ? unlinked : linked);
      },
    },
    {
      "@/app/(auth)/login/_utils/nachocodeNativeOAuth": {
        isNachocodeApp: async () => native,
        getNachocodeNativeOAuthToken: nativeToken,
      },
    },
  );
  const auth = load("lib/client/fetch.ts");
  auth.setTokens(jwt("member-a"), "service-refresh");
  const api = load("lib/client/kakaoLink.ts");
  return { auth, api, window, calls, load, assigned: () => assigned };
}

const params = (customState = state) =>
  new URLSearchParams({ state: customState, code: "new-code" });

test("web linking uses server state and one identical redirect URI, preserves service tokens", async () => {
  const ctx = setup();
  const originalToken = ctx.auth.getToken();
  await ctx.api.startKakaoLink();
  const url = new URL(ctx.assigned());
  assert.equal(url.origin, "https://kauth.kakao.com");
  assert.equal(url.searchParams.get("client_id"), "rest-key");
  assert.equal(url.searchParams.get("state"), state);
  assert.equal(url.searchParams.get("redirect_uri"), callback);
  assert.equal(ctx.calls[0].parsed.redirectUri, callback);
  assert.equal((await ctx.api.completeKakaoWebLink(params())).linked, true);
  assert.equal(ctx.calls[1].url, endpoint);
  assert.deepEqual(ctx.calls[1].parsed, {
    state,
    code: "new-code",
    redirectUri: callback,
  });
  assert.equal(ctx.calls[1].headers.Authorization, `Bearer ${originalToken}`);
  assert.equal(ctx.auth.getToken(), originalToken);
  assert.equal(ctx.auth.getRefreshToken(), "service-refresh");
  assert.equal(ctx.window.sessionStorage.getItem("pillchat:kakao-link"), null);
  await assert.rejects(ctx.api.completeKakaoWebLink(params()));
  assert.equal(ctx.calls.length, 2);
});

for (const kind of [
  "missing",
  "mismatch",
  "expired",
  "malformed",
  "cancelled",
  "missing-code",
  "changed-uri",
  "changed-account",
  "logout",
  "same-account-new-session",
]) {
  test(`${kind}: never sends a completion request and clears pending state`, async () => {
    const ctx = setup();
    await ctx.api.startKakaoLink();
    const query = params();
    const key = "pillchat:kakao-link";
    if (kind === "missing") ctx.window.sessionStorage.removeItem(key);
    if (kind === "mismatch") query.set("state", "forged");
    if (kind === "cancelled") query.set("error", "access_denied");
    if (kind === "missing-code") query.delete("code");
    if (kind === "malformed")
      ctx.window.sessionStorage.setItem(key, "not JSON");
    if (kind === "expired" || kind === "changed-uri") {
      const value = JSON.parse(ctx.window.sessionStorage.getItem(key));
      if (kind === "expired") value.expiresAt = 1;
      else value.redirectUri = "https://other.test/callback";
      ctx.window.sessionStorage.setItem(key, JSON.stringify(value));
    }
    if (kind === "changed-account")
      ctx.auth.setTokens(jwt("member-b"), "refresh-b");
    if (kind === "same-account-new-session")
      ctx.auth.setTokens(jwt("member-a"), "refresh-a2");
    if (kind === "logout") ctx.auth.clearTokens();
    await assert.rejects(ctx.api.completeKakaoWebLink(query));
    assert.equal(ctx.calls.length, 1);
    assert.equal(ctx.window.sessionStorage.getItem(key), null);
  });
}

test("session refresh preserves pending link and uses the refreshed Bearer token", async () => {
  const freshToken = jwt("member-a", 7200);
  const ctx = setup({
    reply: (url) =>
      url === "/api/auth/refresh-token"
        ? ok({ access_token: freshToken, refresh_token: "new-refresh" })
        : undefined,
  });
  await ctx.api.startKakaoLink();
  const session = ctx.auth.getAuthSessionId();
  await ctx.auth.refreshTokens();
  assert.equal(ctx.auth.getAuthSessionId(), session);
  assert.equal((await ctx.api.completeKakaoWebLink(params())).linked, true);
  assert.equal(ctx.calls.at(-1).headers.Authorization, `Bearer ${freshToken}`);
});

test("cross-tab account change invalidates tab state even when the original tab was away", async () => {
  const ctx = setup();
  await ctx.api.startKakaoLink();
  ctx.window.localStorage.setItem("access_token", jwt("member-b"));
  ctx.window.localStorage.setItem("auth_session_id", "other-session");
  await assert.rejects(ctx.api.completeKakaoWebLink(params()));
  assert.equal(ctx.calls.length, 1);
});

test("native flow separates the service JWT from the Kakao token and sends no redirect URI", async () => {
  const ctx = setup({ native: true });
  assert.equal((await ctx.api.startKakaoLink()).linked, true);
  assert.deepEqual(ctx.calls[0].parsed, {});
  assert.equal(ctx.calls[1].url, `${endpoint}/native`);
  assert.deepEqual(ctx.calls[1].parsed, { state, token: "kakao-token" });
  assert.equal(
    ctx.calls[1].headers.Authorization,
    `Bearer ${ctx.auth.getToken()}`,
  );
  assert.equal(ctx.assigned(), undefined);
});

test("native SDK cancellation clears state without sending completion", async () => {
  const ctx = setup({
    native: true,
    nativeToken: async () => {
      throw new Error("cancelled");
    },
  });
  await assert.rejects(ctx.api.startKakaoLink());
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.window.sessionStorage.getItem("pillchat:kakao-link"), null);
});

for (const confirmed of [true, false]) {
  test(`lost completion response: status lookup linked=${confirmed}, never replay POST`, async () => {
    const ctx = setup({
      reply: (url, init) => {
        if (url === endpoint && init.method === "POST")
          throw new TypeError("network lost");
        if (url === endpoint && init.method === "GET")
          return ok(confirmed ? linked : unlinked);
      },
    });
    await ctx.api.startKakaoLink();
    if (confirmed)
      assert.equal((await ctx.api.completeKakaoWebLink(params())).linked, true);
    else await assert.rejects(ctx.api.completeKakaoWebLink(params()));
    assert.equal(
      ctx.calls.filter((c) => c.url === endpoint && c.method === "POST").length,
      1,
    );
    assert.equal(ctx.calls.at(-1).method, "GET");
  });
}

test("401 completion refreshes credentials but never resends the one-time body", async () => {
  const ctx = setup({
    reply: (url, init) => {
      if (url === endpoint && init.method === "POST")
        return Response.json({ code: "INVALID_TOKEN" }, { status: 401 });
      if (url === "/api/auth/refresh-token")
        return ok({
          access_token: jwt("member-a", 7200),
          refresh_token: "refreshed",
        });
    },
  });
  await ctx.api.startKakaoLink();
  await assert.rejects(
    ctx.api.completeKakaoWebLink(params()),
    (err) => err.status === 401,
  );
  assert.equal(ctx.calls.filter((c) => c.url === endpoint).length, 1);
  assert.equal(ctx.auth.getRefreshToken(), "refreshed");
});

test("signed-out status read never reaches the backend", async () => {
  const ctx = setup();
  ctx.auth.clearTokens();
  await assert.rejects(
    ctx.api.getKakaoLinkStatus(),
    (err) => err.status === 401,
  );
  assert.equal(ctx.calls.length, 0);
});

test("status GET may recover a 401 and retry with refreshed credentials", async () => {
  let reads = 0;
  const ctx = setup({
    reply: (url, init) => {
      if (url === endpoint && init.method === "GET") {
        return ++reads === 1
          ? Response.json({ code: "INVALID_TOKEN" }, { status: 401 })
          : ok(linked);
      }
      if (url === "/api/auth/refresh-token")
        return ok({
          access_token: jwt("member-a", 7200),
          refresh_token: "refreshed",
        });
    },
  });
  assert.equal((await ctx.api.getKakaoLinkStatus()).linked, true);
  assert.equal(reads, 2);
});

test("account switch during native authentication never links to the new account", async () => {
  let release;
  let ready;
  const enteredSdk = new Promise((resolve) => {
    ready = resolve;
  });
  const ctx = setup({
    native: true,
    nativeToken: () => {
      ready();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const task = ctx.api.startKakaoLink();
  await enteredSdk;
  ctx.auth.setTokens(jwt("member-b"), "refresh-b");
  release("kakao-token");
  await assert.rejects(task);
  assert.equal(ctx.calls.length, 1);
});

test("concurrent callback invocations consume local state before any network wait", async () => {
  const ctx = setup();
  await ctx.api.startKakaoLink();
  const outcomes = await Promise.allSettled([
    ctx.api.completeKakaoWebLink(params()),
    ctx.api.completeKakaoWebLink(params()),
  ]);
  assert.equal(
    outcomes.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    ctx.calls.filter((call) => call.url === endpoint && call.method === "POST")
      .length,
    1,
  );
});

test("callback can load with expired cookie; other account settings stay protected", () => {
  const load = loader(
    {},
    {
      "next/server": {
        NextResponse: {
          next: () => new Response(null),
          redirect: (url) => Response.redirect(url),
        },
      },
    },
  );
  const middleware = load("middleware.ts").middleware;
  const request = (pathname) => ({
    nextUrl: new URL(`https://pillchat.test${pathname}`),
    url: `https://pillchat.test${pathname}`,
    cookies: { get: () => undefined },
  });
  const callbackResponse = middleware(
    request("/settings/account/kakao/callback"),
  );
  assert.equal(callbackResponse.status, 200);
  assert.match(callbackResponse.headers.get("cache-control"), /no-store/);
  assert.equal(callbackResponse.headers.get("referrer-policy"), "no-referrer");
  assert.equal(
    middleware(request("/settings/account")).headers.get("location"),
    "https://pillchat.test/login",
  );
});

for (const [file, method, path] of [
  ["link/route.ts", "GET", endpoint],
  ["link/route.ts", "POST", endpoint],
  ["link/start/route.ts", "POST", `${endpoint}/start`],
  ["link/native/route.ts", "POST", `${endpoint}/native`],
]) {
  test(`proxy ${method} ${path}: preserves body, Bearer, upstream error and no-store`, async () => {
    let sent;
    const load = loader(
      {
        process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.test" } },
        fetch: async (url, init) => {
          sent = { url, ...init };
          return Response.json(
            { code: "OAUTH_ACCOUNT_ALREADY_LINKED", message: "already linked" },
            { status: 409 },
          );
        },
      },
      { "next/server": { NextResponse: Response } },
    );
    const request = new Request(`https://pillchat.test${path}`, {
      method,
      headers: {
        Authorization: "Bearer service-jwt",
        "Content-Type": "application/json",
      },
      ...(method === "POST"
        ? { body: JSON.stringify({ state, code: "code" }) }
        : {}),
    });
    request.nextUrl = new URL(request.url);
    const result = await load(`app/api/auth/oauth/kakao/${file}`)[method](
      request,
    );
    assert.equal(sent.url, `https://backend.test${path}`);
    assert.equal(sent.method, method);
    assert.equal(sent.headers.get("authorization"), "Bearer service-jwt");
    if (method === "POST")
      assert.equal(
        new TextDecoder().decode(sent.body),
        JSON.stringify({ state, code: "code" }),
      );
    assert.equal(result.status, 409);
    assert.equal((await result.json()).code, "OAUTH_ACCOUNT_ALREADY_LINKED");
    assert.equal(result.headers.get("cache-control"), "no-store");
  });
}

test("proxy rejects cookie-only auth rather than accepting an ambient session", async () => {
  const load = loader(
    {
      fetch: () => {
        throw new Error("must not call upstream");
      },
    },
    { "next/server": { NextResponse: Response } },
  );
  const request = new Request(`https://pillchat.test${endpoint}`, {
    headers: { cookie: "access_token=service-jwt" },
  });
  const result = await load("app/api/auth/oauth/kakao/link/route.ts").GET(
    request,
  );
  assert.equal(result.status, 401);
  assert.equal((await result.json()).code, "AUTH_REQUIRED");
});
