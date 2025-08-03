import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { refreshTokens } from "@/lib/functions";

const JWT_EXPIRY_TIME = 24 * 3600 * 1000; // 24시간

export const useAuth = () => {
  const { getStorageItem, setStorageItem, removeStorageItem } =
    useLocalStorage();

  // 토큰 저장 및 자동 갱신 설정
  const saveTokensAndSetupRefresh = useCallback(
    (accessToken: string, refreshTokenValue: string) => {
      // localStorage에 토큰 저장
      setStorageItem("access_token", accessToken);
      setStorageItem("refresh_token", refreshTokenValue);

      // 자동 토큰 갱신 설정 (24시간 - 1분 전에 갱신)
      setTimeout(() => {
        handleSilentRefresh(accessToken);
      }, JWT_EXPIRY_TIME - 60000);
    },
    [setStorageItem],
  );

  // 자동 토큰 갱신
  const handleSilentRefresh = useCallback(
    async (accessToken: string) => {
      try {
        const response = await refreshTokens();
        if (
          response &&
          typeof response === "object" &&
          "access_token" in response &&
          "refresh_token" in response
        ) {
          const { access_token, refresh_token } = response;
          setStorageItem("access_token", access_token);
          setStorageItem("refresh_token", refresh_token);

          // 다시 자동 갱신 설정
          setTimeout(() => {
            handleSilentRefresh(access_token);
          }, JWT_EXPIRY_TIME - 60000);
        }
      } catch (error: any) {
        console.error("토큰 갱신 실패:", error);
        // 토큰 갱신 실패 시 로그아웃 처리
        clearTokens();
      }
    },
    [setStorageItem],
  );

  // 토큰 삭제 (로그아웃)
  const clearTokens = useCallback(() => {
    removeStorageItem("access_token");
    removeStorageItem("refresh_token");
  }, [removeStorageItem]);

  // 현재 토큰 확인
  const getTokens = useCallback(() => {
    const accessToken = getStorageItem("access_token");
    const refreshTokenValue = getStorageItem("refresh_token");

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      isAuthenticated: !!(accessToken && refreshTokenValue),
    };
  }, [getStorageItem]);

  return {
    saveTokensAndSetupRefresh,
    handleSilentRefresh,
    clearTokens,
    getTokens,
  };
};
