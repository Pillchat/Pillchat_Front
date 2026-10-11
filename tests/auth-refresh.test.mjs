import assert from "node:assert/strict";
import test from "node:test";
import { loader, storage } from "./helpers/load-ts.mjs";

function browser(file, fetch) {
  const document = { cookie: "" };
  const window = {
    localStorage: storage(),
    sessionStorage: storage(),
    dispatchEvent() {},
  };
  const api = loader({ window, document, fetch })(file);
  return { api, document, window };
}

const success = () =>
  Response.json({
    success: true,
    data: { access_token: "new-access", refresh_token: "new-refresh" },
  });

for (const file of ["lib/client/fetch.ts", "lib/functions/fetchData.ts"]) {
  for (const rememberMe of [true, false]) {
    for (const [reason, fail] of [
      ...[400, 429, 500, 502, 503, 504].map((status) => [
        String(status),
        () => new Response("unavailable", { status }),
      ]),
      [
        "offline",
        () => {
          throw new TypeError("Failed to fetch");
        },
      ],
      ["invalid JSON", () => new Response("not json")],
      ["missing token", () => Response.json({ success: true, data: {} })],
    ]) {
      test(`${file}: ${reason}, rememberMe=${rememberMe}: preserve credentials and recover`, async () => {
        let calls = 0;
        const { api, document, window } = browser(file, async () =>
          ++calls === 1 ? fail() : success(),
        );
        api.setTokens("old-access", "old-refresh", rememberMe);
        const cookie = document.cookie;
        assert.equal(await api.refreshTokens(), false);
        assert.equal(api.getToken(), "old-access");
        assert.equal(api.getRefreshToken(), "old-refresh");
        assert.equal(document.cookie, cookie);
        assert.equal((await api.refreshTokens()).access_token, "new-access");
        assert.equal(api.getRefreshToken(), "new-refresh");
        const selected = rememberMe
          ? window.localStorage
          : window.sessionStorage;
        assert.equal(selected.getItem("refresh_token"), "new-refresh");
      });
    }

    for (const status of [401, 403]) {
      test(`${file}: ${status}, rememberMe=${rememberMe}: clear rejected session`, async () => {
        const { api, document } = browser(
          file,
          async () => new Response(null, { status }),
        );
        api.setTokens("old-access", "old-refresh", rememberMe);
        assert.equal(await api.refreshTokens(), false);
        assert.equal(api.getToken(), null);
        assert.equal(api.getRefreshToken(), null);
        assert.match(document.cookie, /max-age=0/);
      });

      test(`${file}: late ${status}, rememberMe=${rememberMe}: preserve a new session with the same refresh token`, async () => {
        let resolveRefresh;
        const { api, document } = browser(
          file,
          () =>
            new Promise((resolve) => {
              resolveRefresh = resolve;
            }),
        );
        api.setTokens("old-access", "same-refresh", rememberMe);
        const pending = api.refreshTokens();
        api.setTokens("other-access", "same-refresh", rememberMe);
        const cookie = document.cookie;
        resolveRefresh(new Response(null, { status }));
        assert.equal(await pending, false);
        assert.equal(api.getToken(), "other-access");
        assert.equal(api.getRefreshToken(), "same-refresh");
        assert.equal(document.cookie, cookie);
      });
    }

    test(`${file}: late success, rememberMe=${rememberMe}: cannot restore a logged-out session`, async () => {
      let resolveRefresh;
      const { api, document } = browser(
        file,
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
      );
      api.setTokens("old-access", "old-refresh", rememberMe);
      const pending = api.refreshTokens();
      api.clearTokens();
      const cookie = document.cookie;
      resolveRefresh(success());
      assert.equal(await pending, false);
      assert.equal(api.getToken(), null);
      assert.equal(api.getRefreshToken(), null);
      assert.equal(document.cookie, cookie);
    });
  }

  test(`${file}: late rejection preserves a newer session`, async () => {
    let resolveRefresh;
    const { api } = browser(
      file,
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    api.setTokens("old-access", "old-refresh");
    const pending = api.refreshTokens();
    api.setTokens("other-access", "other-refresh");
    resolveRefresh(new Response(null, { status: 401 }));
    await pending;
    assert.equal(api.getRefreshToken(), "other-refresh");
  });
}

test("silent refresh exceptions do not clear credentials", async () => {
  let cleared = false;
  const load = loader(
    { console: { error() {} } },
    {
      react: { useCallback: (fn) => fn },
      "@/lib/client/fetch": {
        refreshTokens: async () => {
          throw new TypeError("Failed to fetch");
        },
        clearTokens: () => {
          cleared = true;
        },
      },
    },
  );
  await load("hooks/useAuth.ts").useAuth().handleSilentRefresh("old-access");
  assert.equal(cleared, false);
});

for (const status of [401, 403, 503]) {
  test(`refresh proxy preserves ${status} with a non-JSON response`, async () => {
    const load = loader(
      {
        process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.invalid" } },
        fetch: async () => new Response("not json", { status }),
      },
      { "next/server": { NextResponse: Response } },
    );
    const response = await load("app/api/auth/refresh-token/route.ts").POST({
      json: async () => ({ refreshToken: "old-refresh" }),
    });
    assert.equal(response.status, status);
    assert.equal((await response.json()).success, false);
  });
}
