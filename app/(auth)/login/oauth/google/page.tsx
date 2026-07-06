import { Suspense } from "react";
import { GoogleOAuthCallback } from "./_components/GoogleOAuthCallback";

const GoogleOAuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <p className="text-sm font-medium text-muted-foreground">
            Google 로그인 처리 중입니다.
          </p>
        </div>
      }
    >
      <GoogleOAuthCallback />
    </Suspense>
  );
};

export default GoogleOAuthCallbackPage;
