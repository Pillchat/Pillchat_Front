const getToken = () => {
  const token = localStorage.getItem("access_token");
  return token;
};

const getRefreshToken = () => {
  const token = localStorage.getItem("refresh_token");
  return token;
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// 토큰 갱신 함수
export const refreshTokens = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        setTokens(result.data.access_token, result.data.refresh_token);
        return true;
      }
    }
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
  }

  clearTokens();
  return false;
};

export const fetchPost = async (url: string, data: any) => {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (url !== "/api/auth/login" && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }

  return response;
};
