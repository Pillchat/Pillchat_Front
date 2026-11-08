import { NextRequest } from "next/server";
import { kakaoLinkProxy } from "@/lib/server/kakaoLinkProxy";

export const POST = (request: NextRequest) =>
  kakaoLinkProxy(request, "/api/auth/oauth/kakao/link/start");
