import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Suspense } from "react";
import { KakaoOAuthCallback } from "./_components/KakaoOAuthCallback";

const KakaoOAuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <LoadingIndicator
            label="카카오 로그인 처리 중입니다."
            className="text-sm font-medium text-muted-foreground"
          />
        </div>
      }
    >
      <KakaoOAuthCallback />
    </Suspense>
  );
};

export default KakaoOAuthCallbackPage;
