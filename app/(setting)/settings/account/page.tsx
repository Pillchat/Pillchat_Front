"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { CustomHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { ApiError } from "@/lib/client/fetch";
import { clearKakaoLinkRequest } from "@/lib/client/kakaoLinkStorage";
import {
  getKakaoLinkStatus,
  kakaoLinkErrorMessage,
  startKakaoLink,
  type KakaoLinkStatus,
} from "@/lib/client/kakaoLink";

export default function AccountSettingsPage() {
  const router = useRouter();
  const userId = useAuthIdentity();
  const [status, setStatus] = useState<KakaoLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const revision = useRef(0);
  const working = useRef(false);

  const loadStatus = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setStatus(null);
    setError(null);
    setNeedsLogin(false);
    try {
      const next = await getKakaoLinkStatus();
      if (current === revision.current) setStatus(next);
    } catch (cause) {
      if (current !== revision.current) return;
      setError(kakaoLinkErrorMessage(cause));
      setNeedsLogin(cause instanceof ApiError && cause.status === 401);
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearKakaoLinkRequest();
    void loadStatus();
    return () => {
      revision.current += 1;
    };
  }, [userId, loadStatus]);

  const connect = async () => {
    if (working.current || !status?.canLink || status.linked) return;
    working.current = true;
    setBusy(true);
    setError(null);
    const current = revision.current;
    try {
      const linked = await startKakaoLink();
      if (current === revision.current && linked) setStatus(linked);
    } catch (cause) {
      if (current !== revision.current) return;
      // A fresh read determines whether linking is still permitted after failure.
      const reload = loadStatus();
      const reloadRevision = revision.current;
      await reload;
      if (reloadRevision !== revision.current) return;
      setError(kakaoLinkErrorMessage(cause));
      if (cause instanceof ApiError && cause.status === 401)
        setNeedsLogin(true);
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <CustomHeader title="계정 연결" />
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold">카카오로 간편하게 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            현재 로그인한 필챗 계정에 카카오를 연결합니다. 기존 이메일 로그인과
            프로필, 학습 기록은 그대로 유지됩니다.
          </p>
        </div>
        <section
          className="rounded-2xl border border-border p-5"
          aria-busy={loading || busy}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">카카오 계정</h2>
            <span className="text-sm text-muted-foreground" role="status">
              {loading
                ? "확인 중"
                : status?.linked
                  ? "연결됨"
                  : status
                    ? "연결되지 않음"
                    : "확인 필요"}
            </span>
          </div>
          {status?.linked && (
            <p className="mt-4 text-sm leading-6">
              카카오 연결이 완료되었습니다. 다음부터 카카오로도 이 계정에
              로그인할 수 있습니다.
            </p>
          )}
          {status && !status.linked && !status.canLink && (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {status.provider === "google"
                ? "이미 구글 계정이 연결되어 있습니다. 현재는 소셜 계정을 하나만 연결할 수 있습니다."
                : "현재 계정에는 카카오를 연결할 수 없습니다. 도움이 필요하면 고객 센터로 문의해주세요."}
            </p>
          )}
          {status?.canLink && !status.linked && !needsLogin && (
            <Button
              className="mt-5 w-full bg-[#FEE500] text-[#191919] hover:bg-[#f2da00]"
              disabled={busy || loading}
              onClick={connect}
            >
              {busy ? "카카오 연결 중…" : "카카오 연결하기"}
            </Button>
          )}
        </section>
        {error && (
          <p role="alert" className="text-sm leading-6 text-destructive">
            {error}
          </p>
        )}
        {needsLogin ? (
          <Button onClick={() => router.push("/login")}>
            기존 계정으로 로그인
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={loading || busy}
            onClick={() => void loadStatus()}
          >
            연결 상태 다시 조회
          </Button>
        )}
        <p className="text-xs leading-5 text-muted-foreground">
          연결된 소셜 계정의 교체·해제와 다른 필챗 계정의 기록 병합은 지원하지
          않습니다.
        </p>
      </main>
    </div>
  );
}
