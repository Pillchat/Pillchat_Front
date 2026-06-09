import { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

type ServerFetchOptions = {
  method: string;
  data?: any;
  request?: NextRequest;
};

export const serverFetch = async (
  endpoint: string,
  { method, data, request }: ServerFetchOptions,
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 요청에서 인증 헤더 추출
  if (request) {
    const authorization = request.headers.get("authorization");
    if (authorization) {
      headers["Authorization"] = authorization;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "백엔드 서버 오류",
    }));
    throw new Error(
      JSON.stringify({
        status: response.status,
        message: errorData.message || `HTTP error! status: ${response.status}`,
        data: errorData,
      }),
    );
  }

  // 응답이 비어있으면 빈 객체 반환
  const text = await response.text();
  if (!text) {
    return {};
  }

  // JSON 파싱 시도, 실패하면 성공 메시지 반환
  try {
    return JSON.parse(text);
  } catch {
    return { message: "Success" };
  }
};
