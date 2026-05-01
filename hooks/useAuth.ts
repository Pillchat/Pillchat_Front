import { useCallback } from "react";
import {
  clearTokens as clearStoredTokens,
  getRefreshToken,
  getToken,
  refreshTokens,
  setTokens,
} from "@/lib/functions";

const JWT_EXPIRY_TIME = 24 * 3600 * 1000; // 24시간

export const useAuth = () => {
  const handleSilentRefresh = useCallback(async (_accessToken: string) => {
    try {
      const response = await refreshTokens();
      if (response) {
        setTimeout(() => {
          handleSilentRefresh(response.access_token);
        }, JWT_EXPIRY_TIME - 60000);
      }
    } catch (error: any) {
      console.error("토큰 갱신 실패:", error);
      clearStoredTokens();
    }
  }, []);

  const saveTokensAndSetupRefresh = useCallback(
    (accessToken: string, refreshTokenValue: string, rememberMe = true) => {
      setTokens(accessToken, refreshTokenValue, rememberMe);

      setTimeout(() => {
        handleSilentRefresh(accessToken);
      }, JWT_EXPIRY_TIME - 60000);
    },
    [handleSilentRefresh],
  );

  const clearTokens = useCallback(() => {
    clearStoredTokens();
  }, []);

  const getTokens = useCallback(() => {
    const accessToken = getToken();
    const refreshTokenValue = getRefreshToken();

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      isAuthenticated: !!(accessToken && refreshTokenValue),
    };
  }, []);

  return {
    saveTokensAndSetupRefresh,
    handleSilentRefresh,
    clearTokens,
    getTokens,
  };
};
