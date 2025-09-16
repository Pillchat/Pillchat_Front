export const getToken = () => {
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

  const response = await fetch(url, {
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

export const fetchAPI = async (url: string, method: string, data?: any) => {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestUrl = url;
  let requestBody: string | undefined = undefined;

  if (method.toUpperCase() === "GET" && data) {
    // GET 요청에서는 data를 쿼리 파라미터로 변환
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value as string);
      }
    });
    requestUrl = `${url}?${params.toString()}`;
  } else if (data) {
    // GET이 아닌 요청에서는 body에 JSON 데이터 포함
    requestBody = JSON.stringify(data);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(requestUrl, {
    method,
    body: requestBody,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }

  const result = await response.json();

  return result;
};
