import { NextRequest } from "next/server";
import { handleNativeOAuthProxy } from "../../_utils";

export const POST = async (request: NextRequest) =>
  handleNativeOAuthProxy({
    request,
    provider: "google",
    providerLabel: "Google",
    backendPath:
      process.env.GOOGLE_OAUTH_NATIVE_BACKEND_PATH ??
      "/api/auth/oauth/google/native",
  });
