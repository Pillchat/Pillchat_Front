const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, {
    exports,
    console: { error() {} },
    atob,
    ...globals,
  });
  return exports;
}

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const success = () => Response.json({
  success: true,
  data: { access_token: "new-access", refresh_token: "new-refresh" },
});

for (const file of ["lib/client/fetch.ts", "lib/functions/fetchData.ts"]) {
  for (const rememberMe of [true, false]) {
    for (const [reason, fail] of [
      ...[400, 429, 500, 502, 503, 504].map((status) => [String(status), () => new Response("unavailable", { status })]),
      ["offline", () => { throw new TypeError("Failed to fetch"); }],
      ["invalid JSON", () => new Response("not json")],
      ["missing token", () => Response.json({ success: true, data: {} })],
    ]) {
      test(`${file}: ${reason}, rememberMe=${rememberMe}: preserve credentials and recover`, async () => {
        let calls = 0;
        const document = { cookie: "" };
        const window = { localStorage: storage(), sessionStorage: storage() };
        const api = load(file, { window, document, fetch: async () => ++calls === 1 ? fail() : success() });
        api.setTokens("old-access", "old-refresh", rememberMe);
        const cookie = document.cookie;
        assert.equal(await api.refreshTokens(), false);
        assert.equal(api.getToken(), "old-access");
        assert.equal(api.getRefreshToken(), "old-refresh");
        assert.equal(document.cookie, cookie);
        assert.equal((await api.refreshTokens()).access_token, "new-access");
        assert.equal(api.getRefreshToken(), "new-refresh");
        const selected = rememberMe ? window.localStorage : window.sessionStorage;
        assert.equal(selected.getItem("refresh_token"), "new-refresh");
      });
    }

    for (const status of [401, 403]) {
      test(`${file}: ${status}, rememberMe=${rememberMe}: clear rejected session`, async () => {
        const document = { cookie: "" };
        const api = load(file, {
          window: { localStorage: storage(), sessionStorage: storage() }, document,
          fetch: async () => new Response(null, { status }),
        });
        api.setTokens("old-access", "old-refresh", rememberMe);
        assert.equal(await api.refreshTokens(), false);
        assert.equal(api.getToken(), null);
        assert.equal(api.getRefreshToken(), null);
        assert.match(document.cookie, /max-age=0/);
      });
    }
  }

  test(`${file}: late rejection preserves a newer session`, async () => {
    let rejectRefresh;
    const api = load(file, {
      window: { localStorage: storage(), sessionStorage: storage() }, document: { cookie: "" },
      fetch: () => new Promise((resolve) => { rejectRefresh = resolve; }),
    });
    api.setTokens("old-access", "old-refresh");
    const pending = api.refreshTokens();
    api.setTokens("other-access", "other-refresh");
    rejectRefresh(new Response(null, { status: 401 }));
    await pending;
    assert.equal(api.getRefreshToken(), "other-refresh");
  });
}

test("silent refresh exceptions do not clear credentials", async () => {
  let cleared = false;
  const { useAuth } = load("hooks/useAuth.ts", {
    require: (name) => name === "react" ? { useCallback: (fn) => fn } : {
      refreshTokens: async () => { throw new TypeError("Failed to fetch"); },
      clearTokens: () => { cleared = true; },
    },
  });
  await useAuth().handleSilentRefresh("old-access");
  assert.equal(cleared, false);
});

for (const status of [401, 403, 503]) {
  test(`refresh proxy preserves ${status} with a non-JSON response`, async () => {
    const { POST } = load("app/api/auth/refresh-token/route.ts", {
      process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.invalid" } },
      require: () => ({ NextResponse: Response }),
      fetch: async () => new Response("not json", { status }),
    });
    const response = await POST({ json: async () => ({ refreshToken: "old-refresh" }) });
    assert.equal(response.status, status);
    assert.equal((await response.json()).success, false);
  });
}
