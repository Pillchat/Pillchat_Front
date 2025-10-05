/**
 * JWT 토큰 관련 유틸리티 함수들
 */

type JWTPayload = {
  sub?: string; // subject (userId)
  exp?: number; // expiration time
  iat?: number; // issued at
  userId?: string;
  username?: string;
  [key: string]: any;
};

/**
 * JWT 토큰을 디코딩하여 페이로드를 반환
 * @param token JWT 토큰
 * @returns 디코딩된 페이로드 또는 null
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT는 header.payload.signature 형태
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return null;
    }

    // payload 부분 디코딩 (base64url)
    const payload = parts[1];

    // base64url을 base64로 변환 (패딩 추가)
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    // ✅ UTF-8로 정확하게 디코딩
    const jsonString = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
};

/**
 * 로컬스토리지에서 access_token을 가져와 userId 추출
 * @returns userId 또는 null
 */
export const getCurrentUserId = (): string | null => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return null;
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    return payload.userId || null;
  } catch (error) {
    console.error("Get current user ID error:", error);
    return null;
  }
};

/**
 * JWT 토큰이 만료되었는지 확인
 * @param token JWT 토큰
 * @returns 만료 여부
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp는 초 단위, Date.now()는 밀리초 단위
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * 현재 사용자 정보 (토큰에서 추출 가능한 모든 정보)
 * @returns 사용자 정보 또는 null
 */
export const getCurrentUserInfo = (): JWTPayload | null => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return null;
    }

    return decodeJWT(token);
  } catch (error) {
    console.error("Get current user info error:", error);
    return null;
  }
};
