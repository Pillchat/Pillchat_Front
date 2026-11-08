import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { loader, storage } from "./helpers/load-ts.mjs";

const target = "/learning/weakness?range=wrong&sources=AI%2CCBT&sort=accuracy";
const loginHref = `/login?returnTo=${encodeURIComponent(target)}`;
const response = (data) => ({
  ok: true,
  json: async () => ({ success: true, data }),
});
const tokens = { access_token: "test-access", refresh_token: "test-refresh" };
const flush = () => new Promise(setImmediate);
const nodes = (tree) =>
  Array.isArray(tree)
    ? tree.flatMap(nodes)
    : tree && typeof tree === "object"
      ? [tree, ...nodes(tree.props?.children)]
      : [];

function stateHooks() {
  let cursor = 0;
  const values = [],
    effects = [];
  return {
    reset() {
      cursor = 0;
    },
    effects,
    react: {
      ...React,
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
        return values[i] ?? (values[i] = { current: initial });
      },
      useEffect(effect) {
        effects.push(effect);
      },
    },
  };
}

function browser() {
  const window = {
    location: {
      origin: "https://pillchat.example",
      pathname: "/login",
      search: new URL(loginHref, "https://pillchat.example").search,
    },
    sessionStorage: storage(),
  };
  const load = loader({ window });
  const flow = load("lib/client/loginReturn.ts");
  flow.rememberLoginReturnTo();
  const routes = [],
    savedTokens = [];
  const router = {
    push: (href) => routes.push(href),
    replace: (href) => routes.push(href),
  };
  function component(
    path,
    name = "default",
    { globals = {}, overrides = {} } = {},
  ) {
    const hooks = stateHooks();
    const module = loader(
      { window, console: { ...console, error() {} }, ...globals },
      {
        react: hooks.react,
        "next/navigation": {
          useRouter: () => router,
          useSearchParams: () => new URLSearchParams(window.location.search),
        },
        "@/lib/navigation": { useRouter: () => router },
        "@/hooks": {
          useAuth: () => ({
            saveTokensAndSetupRefresh: (...args) => savedTokens.push(args),
          }),
        },
        ...overrides,
      },
    )(path);
    return {
      ...hooks,
      render() {
        hooks.reset();
        return module[name]();
      },
    };
  }
  return { window, load, flow, routes, savedTokens, component };
}

test("login return allowlist retains learning filters and rejects external or misleading paths", () => {
  const { safeLoginReturnTo } = loader()("lib/client/loginReturn.ts");
  for (const path of [
    target,
    "/learning/weakness/areas?range=today&sources=CBT&sort=due",
    "/learning/weakness/mastered#questions",
    "/learning/weakness/classification/",
    "/learning/recent?filter=wrong",
    "/learning/history?filter=correct",
    "/learning/recent/",
  ]) {
    assert.equal(safeLoginReturnTo(path), path);
  }
  for (const path of [
    null,
    "",
    "https://evil.example/learning/weakness",
    "//evil.example/learning/weakness",
    "/\\evil.example/learning/weakness",
    "javascript:alert(1)",
    "/login",
    "/learning/weakness-other",
    "/learning/history-other",
    "/learning/recent-other",
    "/learning/history/CBT/3",
    "//evil.example/learning/history",
    "/learning/history/../../login",
    "/learning/weakness/../../login",
    "/learning/weakness/%2e%2e/%2e%2e/login",
    "/learning/weakness\n",
    "/learning/weakness?x=" + "a".repeat(2048),
  ]) {
    assert.equal(safeLoginReturnTo(path), null, String(path));
  }
});

test("learning history login returns preserve the chosen list and filter through OAuth", () => {
  for (const returnTo of [
    "/learning/recent?filter=wrong",
    "/learning/history?filter=confused",
  ]) {
    const env = browser();
    env.window.location.search = `?returnTo=${encodeURIComponent(returnTo)}`;
    env.flow.rememberLoginReturnTo();
    env.window.location.search = "?code=mock&state=mock";
    assert.equal(
      env.flow.loginReturnHref(),
      `/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
    assert.equal(env.flow.consumeLoginReturnTo(), returnTo);
    assert.equal(env.flow.consumeLoginReturnTo(), "/");
  }
});

test("OAuth round trips and retries preserve the target until a successful consume", () => {
  const env = browser();
  env.window.location.search = "?code=mock&state=mock";
  assert.equal(env.flow.loginReturnHref(), loginHref);
  assert.equal(env.flow.loginReturnHref(), loginHref);
  assert.equal(env.flow.consumeLoginReturnTo(), target);
  assert.equal(env.flow.loginReturnHref(), "/login");
  assert.equal(env.flow.consumeLoginReturnTo(), "/");
});

const loginUi = {
  "@/components/atoms": { Logo: () => null },
  "@/components/ui/button": { Button: () => null },
  "@radix-ui/react-label": { Label: () => null },
  "@/components/ui/checkbox": { Checkbox: () => null },
  "@/components/molecules": { IconInputField: () => null },
  "@/validations": { emailRules: {}, passwordRules: {} },
  "react-icons/fc": { FcGoogle: () => null },
  "react-icons/ri": { RiKakaoTalkFill: () => null },
  "react-hook-form": {
    useForm: () => ({
      control: {},
      handleSubmit: (fn) => fn,
      watch: () => false,
      formState: { errors: {}, isValid: false },
    }),
    Controller: () => null,
  },
  "./_hooks": {
    useSubmit: () => ({}),
    useGoogleOAuth: () => ({}),
    useKakaoOAuth: () => ({}),
  },
};

test("fresh plain or invalid login entries clear an old target; authenticated reentry resumes valid filters", async () => {
  for (const search of ["", "?returnTo=https%3A%2F%2Fevil.example"]) {
    const env = browser();
    env.window.location.search = search;
    const view = env.component(
      "app/(auth)/login/LoginPageClient.tsx",
      "LoginPageClient",
      {
        overrides: {
          ...loginUi,
          "@/lib/client/fetch": {
            getToken: () => null,
            getRefreshToken: () => null,
          },
          "@/lib/functions": { isTokenExpired: () => true },
        },
      },
    );
    view.render();
    view.effects[0]();
    await flush();
    assert.equal(env.flow.loginReturnHref(), "/login");
    assert.deepEqual(env.routes, []);
  }
  const env = browser();
  const view = env.component(
    "app/(auth)/login/LoginPageClient.tsx",
    "LoginPageClient",
    {
      overrides: {
        ...loginUi,
        "@/lib/client/fetch": { getToken: () => "valid-test-token" },
        "@/lib/functions": { isTokenExpired: () => false },
      },
    },
  );
  view.render();
  view.effects[0]();
  await flush();
  assert.deepEqual(env.routes, [target]);
});

test("server rendering and blocked browser storage have safe fallback behavior", () => {
  const server = loader()("lib/client/loginReturn.ts");
  assert.doesNotThrow(() => server.rememberLoginReturnTo());
  assert.equal(server.consumeLoginReturnTo(), "/");
  assert.equal(server.loginReturnHref(), "/login");
  const window = {
    location: { search: new URL(loginHref, "https://pillchat.example").search },
    get sessionStorage() {
      throw Error("blocked");
    },
  };
  const flow = loader({ window })("lib/client/loginReturn.ts");
  assert.doesNotThrow(() => flow.rememberLoginReturnTo());
  assert.equal(flow.consumeLoginReturnTo(), target);
  assert.equal(flow.loginReturnHref(), "/login");
});

test("email login failures keep the target and only successful authentication consumes it", async () => {
  const env = browser();
  let succeed = false;
  const view = env.component(
    "app/(auth)/login/_hooks/useSubmit.ts",
    "useSubmit",
    {
      overrides: {
        "@/lib/client/fetch": {
          fetchAPI: async () =>
            succeed
              ? { success: true, data: tokens }
              : { success: false, message: "invalid password" },
        },
      },
    },
  );
  await view.render().onSubmit({
    email: "sample@example.test",
    password: "invalid",
    rememberMe: true,
  });
  assert.deepEqual(env.routes, []);
  assert.equal(env.flow.loginReturnHref(), loginHref);
  succeed = true;
  await view.render().onSubmit({
    email: "sample@example.test",
    password: "valid",
    rememberMe: true,
  });
  assert.deepEqual(env.routes, [target]);
  assert.equal(env.savedTokens.length, 1);
  env.window.location.search = "";
  assert.equal(env.flow.loginReturnHref(), "/login");
});

for (const [provider, title] of [
  ["google", "Google"],
  ["kakao", "Kakao"],
]) {
  test(`${title} native OAuth consumes only authenticated returns and retains onboarding targets`, async () => {
    for (const requiresOnboarding of [false, true]) {
      const env = browser();
      const calls = [];
      const view = env.component(
        `app/(auth)/login/_hooks/use${title}OAuth.ts`,
        `use${title}OAuth`,
        {
          globals: {
            fetch: async (url) => {
              calls.push(url);
              return response(
                requiresOnboarding
                  ? { requiresOnboarding: true, oauthSignupToken: "temporary" }
                  : tokens,
              );
            },
          },
          overrides: {
            "../_utils/nachocodeNativeOAuth": {
              isNachocodeApp: async () => true,
            },
            "./nachocodeNativeOAuth": {
              getNachocodeNativeOAuthToken: async () => "native-test-token",
            },
          },
        },
      );
      const hook = view.render();
      await hook[`start${title}Login`]();
      assert.deepEqual(calls, [`/api/auth/oauth/${provider}/native`]);
      assert.deepEqual(env.routes, [
        requiresOnboarding ? "/onboarding/oauth" : target,
      ]);
      env.window.location.search = "";
      assert.equal(
        env.flow.loginReturnHref(),
        requiresOnboarding ? loginHref : "/login",
      );
    }
  });

  test(`${title} web OAuth preserves filters through success, onboarding, cancellation and callback reentry`, async () => {
    for (const outcome of ["success", "onboarding", "cancelled"]) {
      const env = browser();
      env.window.sessionStorage.setItem(
        `${provider}_oauth_state`,
        "matching-state",
      );
      env.window.location.search =
        outcome === "cancelled"
          ? "?error=access_denied"
          : "?code=mock&state=matching-state";
      let exchanges = 0;
      const view = env.component(
        `app/(auth)/login/oauth/${provider}/_components/${title}OAuthCallback.tsx`,
        `${title}OAuthCallback`,
        {
          globals: {
            fetch: async () => {
              exchanges++;
              return response(
                outcome === "onboarding"
                  ? { requiresOnboarding: true, oauthSignupToken: "temporary" }
                  : tokens,
              );
            },
          },
        },
      );
      view.render();
      view.effects[0]();
      view.effects[0]();
      await flush();
      assert.equal(exchanges, outcome === "cancelled" ? 0 : 1);
      if (outcome === "cancelled") {
        nodes(view.render())
          .find((node) => node.props?.children === "로그인으로 돌아가기")
          .props.onClick();
        assert.deepEqual(env.routes, [loginHref]);
      } else {
        assert.deepEqual(env.routes, [
          outcome === "onboarding" ? "/onboarding/oauth" : target,
        ]);
      }
      assert.equal(
        env.flow.loginReturnHref(),
        outcome === "success" ? "/login" : loginHref,
      );
    }
  });
}

const onboardingUi = {
  "@/components/atoms": { SolidButton: () => null },
  "@/components/molecules": { StepHeader: () => null },
  "../../signup/_components/SignupInfoFlow": { SignupInfoFlow: () => null },
  "../../signup/_hooks": { TERMS_TEXT: "terms", PRIVACY_TEXT: "privacy" },
};

test("onboarding success consumes the target while cancellation or an expired session returns to the same login", async () => {
  for (const outcome of ["success", "cancelled", "expired"]) {
    const env = browser();
    env.window.location.search = "";
    if (outcome !== "expired")
      env
        .load("app/(auth)/login/_utils/oauthSignup.ts")
        .savePendingOAuthSignup({
          provider: "google",
          oauthSignupToken: "temporary",
          rememberMe: false,
          ...(outcome === "success"
            ? {
                signupDraft: {
                  realName: "테스트",
                  nickname: "학습자",
                  grade: "1학년",
                  university: "",
                  signupSource: "학교",
                  agreeToTerms: true,
                  agreeToPrivacy: true,
                },
              }
            : {}),
        });
    const view = env.component(
      "app/(auth)/onboarding/oauth/page.tsx",
      "default",
      {
        globals: { fetch: async () => response(tokens) },
        overrides: onboardingUi,
      },
    );
    view.render();
    view.effects[0]();
    await flush();
    if (outcome !== "expired") {
      const form = nodes(view.render()).find(
        (node) => node.props?.completeLabel,
      );
      if (outcome === "cancelled") form.props.onExit();
      else {
        form.props.onComplete();
        await flush();
      }
    }
    assert.deepEqual(env.routes, [outcome === "success" ? target : loginHref]);
    assert.equal(
      env.flow.loginReturnHref(),
      outcome === "success" ? "/login" : loginHref,
    );
  }
});
