import { NextRequest } from "next/server";
import { kakaoLinkProxy } from "@/lib/server/kakaoLinkProxy";

export const GET = (request: NextRequest) =>
  kakaoLinkProxy(request, "/api/auth/oauth/kakao/link");
export const POST = GET;
