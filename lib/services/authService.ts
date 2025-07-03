import axios from "axios";

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

export type RefreshTokenResponse = {
  success: boolean;
  data?: {
    access: string;
    refresh: string;
  };
  message?: string;
};

// 로그인 API 호출
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`/api/auth/login`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "로그인에 실패했습니다. 다시 시도해주세요.",
    );
  }
};

// 토큰 갱신 API 호출
export const refreshToken = async (
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  try {
    const response = await axios.post(
      `/api/auth/refresh-token`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "토큰 갱신에 실패했습니다.",
    );
  }
};
