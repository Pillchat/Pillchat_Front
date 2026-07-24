"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Toast } from "@/components/atoms";
import { AppShell } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useExpectedFeatureSurveyMutation } from "@/hooks/mutations";
import {
  notificationConsentQueryKey,
  useNotificationConsentQuery,
} from "@/hooks/queries";
import { getCurrentUserId } from "@/lib/client/auth";
import { getValidAccessToken } from "@/lib/client/fetch";
import { useRouter } from "@/lib/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationConsentStatus } from "@/types/notification";
import { ExpectedFeatureSurveyDialog } from "./_components/ExpectedFeatureSurveyDialog";

const CONSENT_STATUS_ERROR_MESSAGE =
  "알림 신청 상태를 불러오지 못했습니다. 다시 시도해 주세요.";

const previewItems = [
  {
    title: "AI 플래시카드",
    description: "취약 개념을 반복해서 복습하는 학습 루틴",
    href: "/flashcards",
    iconSrc: "/FlashCard.svg",
  },
  {
    title: "문제 은행",
    description: "국시 유형을 실전처럼 풀어보는 문제 환경",
    href: "/questionbank",
    iconSrc: "/CBT.svg",
  },
  {
    title: "약사국시 CBT 실전 연습",
    description: "실제 시험 흐름으로 시간 관리와 답안 선택을 연습해요",
    href: "/learning/cbt",
    iconSrc: "/CBT.svg",
  },
  {
    title: "서술형 도우미",
    description: "키워드와 이미지로 정리하는 암기 보조",
    href: "/learn/image-maker",
    iconSrc: "/Image2.svg",
  },
];

function ToolIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-8 w-8 bg-current"
      style={{
        WebkitMaskImage: `url(${src})`,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskImage: `url(${src})`,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
      }}
    />
  );
}

export default function LearnPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState<string | null>();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const checkAuthentication = async () => {
      const token = await getValidAccessToken();
      if (!isCancelled) {
        setAuthUserId(token ? (getCurrentUserId() ?? "current-user") : null);
      }
    };

    checkAuthentication().catch(() => {
      if (!isCancelled) setAuthUserId(null);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const isAuthenticated = typeof authUserId === "string";
  const consentQuery = useNotificationConsentQuery(authUserId ?? null);
  const hasAgreed = consentQuery.data?.agreed === true;
  const hasCompletedSurvey = consentQuery.data?.surveyCompleted === true;
  const hasConsentStatusError = isAuthenticated && consentQuery.isError;

  useEffect(() => {
    if (!hasConsentStatusError) return;

    setToastMessage(CONSENT_STATUS_ERROR_MESSAGE);
    setToastKey((current) => current + 1);
    setToastOpen(true);
  }, [consentQuery.errorUpdatedAt, hasConsentStatusError]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastKey((current) => current + 1);
    setToastOpen(true);
  };

  const surveyMutation = useExpectedFeatureSurveyMutation({
    onSuccess: () => {
      if (authUserId) {
        queryClient.setQueryData<NotificationConsentStatus>(
          notificationConsentQueryKey(authUserId),
          { agreed: true, surveyCompleted: true },
        );
      }
      setSurveyDialogOpen(false);
      showToast("알림 신청과 설문 참여가 완료되었습니다");
    },
    onError: (error) => {
      showToast(
        error.message ||
          "알림 신청과 설문 참여를 완료하지 못했습니다. 다시 시도해 주세요.",
      );
    },
  });

  const handleNotificationConsent = () => {
    if (authUserId === null) {
      router.push("/login");
      return;
    }

    if (!isAuthenticated || hasCompletedSurvey) return;
    surveyMutation.reset();
    setSurveyDialogOpen(true);
  };

  const isCheckingConsent = isAuthenticated && consentQuery.isFetching;
  const isButtonDisabled =
    authUserId === undefined ||
    isCheckingConsent ||
    hasConsentStatusError ||
    surveyMutation.isPending ||
    hasCompletedSurvey;

  const buttonLabel =
    authUserId === undefined
      ? "로그인 확인 중..."
      : authUserId === null
        ? "로그인하고 오픈 알림 신청하기"
        : isCheckingConsent
          ? "신청 여부 확인 중..."
          : hasConsentStatusError
            ? "신청 상태를 확인하지 못했습니다"
            : surveyMutation.isPending
              ? "설문 제출 중..."
              : hasCompletedSurvey
                ? "알림 신청 및 설문 참여 완료"
                : hasAgreed
                  ? "기대 기능 설문 참여하기"
                  : "오픈 알림 신청하고 혜택 받기";

  return (
    <AppShell bottomSpacing="cta" className="flex flex-col">
      <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between bg-background px-6">
        <Link href="/" aria-label="홈으로 이동" className="flex items-center">
          <Image
            src="/brand/PillChat.svg"
            alt="PillChat"
            width={82}
            height={32}
            priority
          />
        </Link>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand">
          9월 오픈
        </span>
      </header>

      <main className="flex flex-1 flex-col px-6 pt-10">
        <section>
          <p className="text-sm font-semibold text-brand">PillChat Learn</p>
          <h1 className="mt-3 text-headline-large text-foreground">
            약대 학습 솔루션,
            <br />
            9월 전격 출시!
          </h1>
          <p className="mt-4 text-body-large text-muted-foreground">
            약대생의 복습, 기출 풀이, 서술형 암기를 한 흐름으로 이어주는 학습
            탭을 준비하고 있어요.
          </p>
        </section>

        <section
          className="mt-10 flex flex-col gap-3"
          aria-label="출시 예정 기능"
        >
          {previewItems.map((item) => {
            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary-600">
                  <ToolIcon src={item.iconSrc} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-base font-semibold text-foreground">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </>
            );

            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-3 py-4 transition-transform active:scale-[0.98]"
              >
                {content}
              </Link>
            ) : (
              <div key={item.title} className="flex items-center gap-3 py-4">
                {content}
              </div>
            );
          })}
        </section>
      </main>

      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-app -translate-x-1/2 bg-background px-6 py-3 md:px-8">
        {hasConsentStatusError && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              알림 신청 상태를 확인할 수 없습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={consentQuery.isFetching}
              onClick={() => void consentQuery.refetch()}
            >
              {consentQuery.isFetching ? "확인 중..." : "다시 시도"}
            </Button>
          </div>
        )}
        <Button
          type="button"
          className="h-14 w-full gap-1 active:scale-[0.98] [&_svg]:size-6"
          disabled={isButtonDisabled}
          aria-busy={surveyMutation.isPending || isCheckingConsent}
          onClick={handleNotificationConsent}
        >
          <Bell aria-hidden="true" strokeWidth={1.5} />
          <p>{buttonLabel}</p>
        </Button>
      </div>

      <ExpectedFeatureSurveyDialog
        open={surveyDialogOpen}
        isSubmitting={surveyMutation.isPending}
        hasSubmitError={surveyMutation.isError}
        onOpenChange={setSurveyDialogOpen}
        onSubmit={(request) => surveyMutation.mutate(request)}
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        toastKey={toastKey}
      />
    </AppShell>
  );
}
