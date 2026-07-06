import { Suspense } from "react";
import { KakaoOAuthCallback } from "./_components/KakaoOAuthCallback";

const KakaoOAuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <p className="text-sm font-medium text-muted-foreground">
            카카오 로그인 처리 중입니다.
          </p>
        </div>
      }
    >
      <KakaoOAuthCallback />
    </Suspense>
  );
};

export default KakaoOAuthCallbackPage;
