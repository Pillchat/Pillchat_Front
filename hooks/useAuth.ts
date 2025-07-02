import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { refreshToken } from "@/app/functions/authService";

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

      console.log("토큰이 localStorage에 저장되었습니다:", {
        access_token: accessToken,
        refresh_token: refreshTokenValue,
      });

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
        const response = await refreshToken(accessToken);

        if (response.success && response.data) {
          const { access, refresh } = response.data;
          setStorageItem("access_token", access);
          setStorageItem("refresh_token", refresh);

          // 다시 자동 갱신 설정
          setTimeout(() => {
            handleSilentRefresh(access);
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
