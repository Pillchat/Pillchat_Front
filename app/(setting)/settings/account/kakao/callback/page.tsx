"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { ApiError } from "@/lib/client/fetch";
import {
  completeKakaoWebLink,
  kakaoLinkErrorMessage,
} from "@/lib/client/kakaoLink";

export default function KakaoLinkCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    // Remove credentials from the URL even on cancellation or invalid state.
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    void completeKakaoWebLink(params)
      .then(() => {
        router.replace("/settings/account");
      })
      .catch((cause) => {
        setError(kakaoLinkErrorMessage(cause));
        setNeedsLogin(cause instanceof ApiError && cause.status === 401);
      });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-xl font-semibold">카카오 계정 연결</h1>
      {error ? (
        <>
          <p role="alert" className="text-sm leading-6 text-muted-foreground">
            {error}
          </p>
          {needsLogin && (
            <Button className="w-full" onClick={() => router.replace("/login")}>
              기존 계정으로 로그인
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.replace("/settings/account")}
          >
            계정 연결 화면으로
          </Button>
        </>
      ) : (
        <LoadingIndicator label="카카오 계정을 연결하고 있습니다." />
      )}
    </main>
  );
}
