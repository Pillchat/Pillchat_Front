import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Suspense } from "react";
import { GoogleOAuthCallback } from "./_components/GoogleOAuthCallback";

const GoogleOAuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <LoadingIndicator
            label="Google 로그인 처리 중입니다."
            className="text-sm font-medium text-muted-foreground"
          />
        </div>
      }
    >
      <GoogleOAuthCallback />
    </Suspense>
  );
};

export default GoogleOAuthCallbackPage;
