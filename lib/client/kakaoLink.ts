import { getCurrentUserId } from "./auth";
import {
  ApiError,
  getAuthSessionId,
  getValidAccessToken,
  recoverAccessToken,
} from "./fetch";
import {
  clearKakaoLinkRequest,
  KAKAO_LINK_STORAGE_KEY,
} from "./kakaoLinkStorage";
import {
  getNachocodeNativeOAuthToken,
  isNachocodeApp,
} from "@/app/(auth)/login/_utils/nachocodeNativeOAuth";

// Register each deployed origin + this path as a Redirect URI in the Kakao app
// shared with the backend. NEXT_PUBLIC_KAKAO_REDIRECT_URI is for login only.
export const KAKAO_LINK_CALLBACK_PATH = "/settings/account/kakao/callback";
const ENDPOINT = "/api/auth/oauth/kakao/link";
type Owner = { userId: string; sessionId: string | null };
type PendingLink = Owner & {
  state: string;
  redirectUri?: string;
  expiresAt: number;
};
export type KakaoLinkStatus = {
  provider: string | null;
  linked: boolean;
  canLink: boolean;
};

const authRequired = () =>
  new ApiError(401, {
    code: "AUTH_REQUIRED",
    message: "기존 필챗 계정으로 로그인한 뒤 카카오 연결을 다시 시작해주세요.",
  });
const invalidState = () =>
  new ApiError(400, {
    code: "INVALID_OAUTH_LINK_STATE",
    message:
      "연결 요청이 만료되었거나 유효하지 않습니다. 계정 연결 화면에서 다시 시작해주세요.",
  });
const owner = (): Owner => {
  const userId = getCurrentUserId();
  if (!userId) throw authRequired();
  return { userId, sessionId: getAuthSessionId() };
};
const assertOwner = (expected: Owner) => {
  if (
    getCurrentUserId() !== expected.userId ||
    getAuthSessionId() !== expected.sessionId
  ) {
    clearKakaoLinkRequest();
    throw authRequired();
  }
};

async function requestLink(
  path: string,
  method: "GET" | "POST",
  expected: Owner,
  body?: unknown,
) {
  assertOwner(expected);
  const token = await getValidAccessToken();
  assertOwner(expected);
  if (!token) throw authRequired();
  const send = (accessToken: string) =>
    fetch(path, {
      method,
      credentials: "omit",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  let response = await send(token);
  assertOwner(expected);
  if (response.status === 401) {
    const recovered = await recoverAccessToken(token);
    assertOwner(expected);
    // Only status reads may be replayed. A completion may have consumed its state.
    if (method === "GET" && recovered) response = await send(recovered);
    else throw authRequired();
  }
  const result = await response.json();
  assertOwner(expected);
  if (!response.ok || result?.success !== true) {
    throw new ApiError(response.status, result);
  }
  return result.data;
}

function parseStatus(data: any): KakaoLinkStatus {
  if (
    !data ||
    typeof data.linked !== "boolean" ||
    typeof data.canLink !== "boolean"
  ) {
    throw new Error(
      "카카오 연결 상태를 확인하지 못했습니다. 다시 조회해주세요.",
    );
  }
  return {
    provider: data.provider ?? null,
    linked: data.linked,
    canLink: data.canLink,
  };
}

export const getKakaoLinkStatus = async (expected = owner()) =>
  parseStatus(await requestLink(ENDPOINT, "GET", expected));

function consumeRequest(state: string | null, web: boolean): PendingLink {
  const raw = window.sessionStorage.getItem(KAKAO_LINK_STORAGE_KEY);
  clearKakaoLinkRequest();
  let pending: PendingLink | null = null;
  try {
    pending = JSON.parse(raw ?? "null");
  } catch {
    /* Invalid tab state. */
  }
  if (
    !pending ||
    !state ||
    pending.state !== state ||
    !Number.isFinite(pending.expiresAt) ||
    pending.expiresAt <= Date.now() ||
    Boolean(pending.redirectUri) !== web
  )
    throw invalidState();
  assertOwner(pending);
  return pending;
}

async function completeLink(pending: PendingLink, path: string, body: unknown) {
  try {
    const status = parseStatus(await requestLink(path, "POST", pending, body));
    if (!status.linked)
      throw new Error("카카오 연결이 완료되지 않았습니다. 다시 시작해주세요.");
    return status;
  } catch (error) {
    // Resolve an uncertain outcome with a read; never resend state/code/token.
    if (!(error instanceof ApiError) || error.status >= 500) {
      try {
        const status = await getKakaoLinkStatus(pending);
        if (status.linked) return status;
      } catch {
        /* The settings page offers a fresh status read. */
      }
    }
    throw error;
  }
}

export async function startKakaoLink(): Promise<KakaoLinkStatus | null> {
  clearKakaoLinkRequest();
  const expected = owner();
  try {
    const native = await isNachocodeApp();
    const redirectUri = native
      ? undefined
      : `${window.location.origin}${KAKAO_LINK_CALLBACK_PATH}`;
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!native && !clientId)
      throw new Error("카카오 연결 설정을 확인해주세요.");
    const data = await requestLink(
      `${ENDPOINT}/start`,
      "POST",
      expected,
      native ? {} : { redirectUri },
    );
    if (
      typeof data?.state !== "string" ||
      !data.state ||
      typeof data.expiresIn !== "number" ||
      data.expiresIn <= 0 ||
      !Number.isFinite(data.expiresIn)
    ) {
      throw new Error("카카오 연결 요청을 시작하지 못했습니다.");
    }
    const pending: PendingLink = {
      ...expected,
      state: data.state,
      redirectUri,
      expiresAt: Date.now() + Math.min(data.expiresIn, 600) * 1000,
    };
    window.sessionStorage.setItem(
      KAKAO_LINK_STORAGE_KEY,
      JSON.stringify(pending),
    );
    if (native) {
      const token = await getNachocodeNativeOAuthToken("kakao");
      const consumed = consumeRequest(pending.state, false);
      return await completeLink(consumed, `${ENDPOINT}/native`, {
        state: consumed.state,
        token,
      });
    }
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.searchParams.set("client_id", clientId!);
    url.searchParams.set("redirect_uri", redirectUri!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", pending.state);
    window.location.assign(url.toString());
    return null;
  } catch (error) {
    clearKakaoLinkRequest();
    throw error;
  }
}

export async function completeKakaoWebLink(params: URLSearchParams) {
  if (params.has("error")) {
    clearKakaoLinkRequest();
    throw new Error(
      params.get("error") === "access_denied"
        ? "카카오 연결을 취소했습니다."
        : "카카오 인증에 실패했습니다. 계정 연결 화면에서 다시 시작해주세요.",
    );
  }
  const pending = consumeRequest(params.get("state"), true);
  const code = params.get("code");
  if (
    !code ||
    pending.redirectUri !==
      `${window.location.origin}${KAKAO_LINK_CALLBACK_PATH}`
  )
    throw invalidState();
  return completeLink(pending, ENDPOINT, {
    state: pending.state,
    code,
    redirectUri: pending.redirectUri,
  });
}

export function kakaoLinkErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return authRequired().message;
    if (error.code === "INVALID_OAUTH_LINK_STATE")
      return invalidState().message;
    if (error.code === "OAUTH_ACCOUNT_ALREADY_LINKED")
      return "다른 필챗 계정에 연결된 카카오 계정입니다. 해당 필챗 계정으로 로그인해주세요.";
    if (error.code === "OAUTH_LINK_NOT_ALLOWED")
      return "이미 연결된 소셜 계정은 교체할 수 없습니다. 연결 상태를 다시 확인해주세요.";
    if (error.status >= 500)
      return "일시적으로 연결을 확인하지 못했습니다. 연결 상태를 다시 조회한 뒤 시도해주세요.";
    return error.message;
  }
  if (
    error instanceof TypeError ||
    (error instanceof Error && error.name === "TimeoutError")
  ) {
    return "서버 응답을 확인하지 못했습니다. 연결 상태를 다시 조회해주세요.";
  }
  return error instanceof Error
    ? error.message
    : "카카오 연결에 실패했습니다. 다시 시작해주세요.";
}
