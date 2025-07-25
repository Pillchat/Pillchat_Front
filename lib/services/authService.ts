import { fetchPost, setTokens, clearTokens, refreshTokens } from "../functions";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
};

// 로그인 API 호출
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const result = await fetchPost(`/api/auth/login`, data).then((res) =>
      res.json(),
    );

    // 로그인 성공 시 토큰 저장
    if (result.success && result.data) {
      setTokens(result.data.access_token, result.data.refresh_token);
    }

    return result;
  } catch (error: any) {
    throw new Error(
      error.message || "로그인에 실패했습니다. 다시 시도해주세요.",
    );
  }
};
