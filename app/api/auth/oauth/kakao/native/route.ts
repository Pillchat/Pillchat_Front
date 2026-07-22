import { NextRequest } from "next/server";
import { handleNativeOAuthProxy } from "../../_utils";

export const POST = async (request: NextRequest) =>
  handleNativeOAuthProxy({
    request,
    provider: "kakao",
    providerLabel: "카카오",
    backendPath:
      process.env.KAKAO_OAUTH_NATIVE_BACKEND_PATH ??
      "/api/auth/oauth/kakao/native",
  });
