export const KAKAO_LINK_STORAGE_KEY = "pillchat:kakao-link";

export const clearKakaoLinkRequest = () => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(KAKAO_LINK_STORAGE_KEY);
  }
};
