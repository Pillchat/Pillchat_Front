"use client";

import {
  BadgeCheck,
  GalleryVerticalEnd,
  Monitor,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";
import { useRouter } from "@/lib/navigation";

import EntryButton from "./_components/EntryButton";

// PDF 기반 문제 생성 기능이 중단되어 기존 문제 모음의 진입점을 숨깁니다.
const SHOW_PDF_QUESTION_COLLECTION = false;

const QuestionBankPage = () => {
  const router = useRouter();

  return (
    <AppShell className="flex flex-col bg-white">
      <MeaninglessHeader />

      <main className="flex flex-1 flex-col px-5 pb-8 pt-2 md:px-10">
        <header className="pb-5 md:pb-7">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-[1.75rem]">
              문제은행
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              추천 학습부터 원하는 방식까지 바로 시작해보세요.
            </p>
          </div>
        </header>

        <section aria-label="학습 메뉴">
          <div className="flex flex-col gap-3">
            <EntryButton
              icon={<GalleryVerticalEnd className="h-7 w-7 text-primary" />}
              title="AI 플래시카드"
              subtitle="취약 개념을 반복해서 복습하는 학습 루틴"
              onClick={() => router.push("/flashcards")}
            />

            <EntryButton
              icon={<Monitor className="h-7 w-7 text-primary" />}
              title="CBT 형태로 학습하기"
              subtitle="국가시험과 같은 시간·답안 환경에서 연습해요"
              onClick={() => router.push("/learning/cbt")}
            />

            <EntryButton
              icon={<BadgeCheck className="h-7 w-7 text-primary" />}
              title="수제 제작 문제"
              subtitle="전문가가 직접 만들고 검수한 문제를 풀어요"
              onClick={() => router.push("/questionbank/handcrafted")}
            />

            <EntryButton
              icon={<Sparkles className="h-7 w-7 text-primary" />}
              title="AI 문제 생성"
              subtitle="내 학습자료와 설정을 바탕으로 문제를 만들어요"
              onClick={() => router.push("/questionbank/premium")}
            />

            <EntryButton
              icon={<RotateCcw className="h-7 w-7 text-primary" />}
              title="복습하기"
              subtitle="CBT·수제 제작·AI 생성 문제의 오답을 모아 복습해요"
              onClick={() => router.push("/questionbank/review")}
            />
          </div>
        </section>

        {SHOW_PDF_QUESTION_COLLECTION && (
          <section className="mt-8" aria-label="학습 기록">
            <button
              type="button"
              onClick={() => router.push("/questionbank/my-tasks")}
              className="rounded-xl border border-gray-200 px-4 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <p className="text-sm font-bold text-foreground">내 문제 모음</p>
              <p className="mt-1 text-xs text-muted-foreground">
                저장한 세트 이어 풀기
              </p>
            </button>
          </section>
        )}
      </main>
    </AppShell>
  );
};

export default QuestionBankPage;
