"use client";

import { Button } from "@/components/ui/button";
import { getValidAccessToken } from "@/lib/client/fetch";
import { useRouter } from "@/lib/navigation";
import {
  Bell,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  PanelTop,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IntroTab = "community" | "learn" | "market";

const tabs: Array<{ id: IntroTab; label: string }> = [
  { id: "community", label: "커뮤니티" },
  { id: "learn", label: "학습기능" },
  { id: "market", label: "마켓" },
];

const simpleSlides = {
  community: {
    title: "함께라서 든든해요",
    description: "전국 학생들과 공부 고민을 나눠보세요",
    icon: MessageCircle,
  },
  market: {
    title: "필요한 교재 한 곳에서",
    description: "선배들이 쓴 교재를 저렴하게 만나보세요",
    icon: ShoppingBag,
  },
};

const learnFeatures = [
  {
    title: "AI 플래시카드",
    description: "취약 개념을 반복해서 복습하는 학습 루틴",
    icon: Layers,
  },
  {
    title: "문제 은행",
    description: "국시 유형을 실전처럼 풀어보는 문제 환경",
    icon: PanelTop,
  },
  {
    title: "서술형 도우미",
    description: "키워드와 이미지로 정리하는 암기 보조",
    icon: ImageIcon,
  },
];

export default function IntroPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<IntroTab>("community");

  useEffect(() => {
    const redirectAuthenticatedUser = async () => {
      const token = await getValidAccessToken();
      if (token) router.replace("/");
    };

    redirectAuthenticatedUser();
  }, [router]);

  const simpleSlide = useMemo(() => {
    if (activeTab === "learn") return null;
    return simpleSlides[activeTab];
  }, [activeTab]);
  const SimpleSlideIcon = simpleSlide?.icon;

  const handlePrimaryAction = () => {
    router.push("/signup");
  };

  return (
    <main className="min-h-dvh bg-[#e8e6e1] md:flex md:items-center md:justify-center md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-[#fffaf1] px-7 py-7 shadow-[0_1.5rem_3rem_rgba(17,17,17,0.08)] md:min-h-[calc(100dvh-3rem)] md:rounded-[2rem]">
        <div className="mt-7 rounded-full bg-[#edf3fb] p-1.5">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`h-[3.25rem] rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#fffaf1] text-brand shadow-[0_0.25rem_0.75rem_rgba(17,17,17,0.14)]"
                      : "text-[#61728e]"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {simpleSlide ? (
          <div className="flex flex-1 flex-col items-center text-center">
            <div className="mt-14 flex flex-col gap-3">
              <h1 className="text-[1.75rem] font-bold leading-tight text-[#17100c]">
                {simpleSlide.title}
              </h1>
              <p className="text-base font-medium text-[#61728e]">
                {simpleSlide.description}
              </p>
            </div>

            <div className="mt-auto flex h-[16rem] w-full items-center justify-center">
              <div className="flex h-[11.75rem] w-[11.75rem] items-center justify-center rounded-full bg-[#ffe1d5]">
                {SimpleSlideIcon && (
                  <SimpleSlideIcon
                    strokeWidth={2.6}
                    className="h-20 w-20 text-brand"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="mt-10">
              <p className="text-lg font-bold text-brand">PillChat Learn</p>
              <h1 className="mt-6 text-[2rem] font-bold leading-[1.28] text-[#111111]">
                약대 학습 솔루션,
                <br />
                9월 전격 출시!
              </h1>
              <p className="mt-6 text-base font-medium leading-[1.75] text-[#666666]">
                약대생의 복습, 기출 풀이, 서술형 암기를 한 흐름으로 이어주는
                학습 탭을 준비하고 있어요.
              </p>
            </div>

            <div className="mt-8 flex flex-col">
              {learnFeatures.map((feature, index) => (
                <div key={feature.title}>
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-xl bg-[#fff3f2]">
                      <feature.icon
                        strokeWidth={2.4}
                        className="h-7 w-7 text-[#222222]"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-[#111111]">
                        {feature.title}
                      </h2>
                      <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#666666]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  {index < learnFeatures.length - 1 && (
                    <div className="h-px bg-[#d6d6d6]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="mb-5 flex justify-center gap-2">
            {tabs.map((tab) => (
              <span
                key={tab.id}
                className={`h-3 rounded-full transition-all ${
                  activeTab === tab.id ? "w-8 bg-brand" : "w-3 bg-[#ffe1d5]"
                }`}
              />
            ))}
          </div>

          <Button
            type="button"
            className="h-14 w-full whitespace-normal rounded-xl px-4 py-0 text-base font-bold leading-tight"
            onClick={handlePrimaryAction}
          >
            {activeTab === "learn" && (
              <Bell strokeWidth={2.2} className="!h-6 !w-6" />
            )}
            {activeTab === "learn"
              ? "오픈 알림 신청하고 혜택 받기"
              : "가볍게 시작하기"}
          </Button>

          <button
            type="button"
            className="mt-4 h-10 w-full text-center text-sm font-semibold text-[#61728e]"
            onClick={() => router.push("/login")}
          >
            이미 회원이에요
          </button>
        </div>
      </section>
    </main>
  );
}
