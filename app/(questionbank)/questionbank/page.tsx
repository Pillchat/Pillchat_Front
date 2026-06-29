"use client";

import Image from "next/image";

import { useRouter } from "@/lib/navigation";
import { MeaninglessHeader, BottomNavbar } from "@/components/molecules";
import EntryButton from "./_components/EntryButton";

function MenuIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      aria-hidden="true"
      className="h-8 w-8"
    />
  );
}

const QuestionBankPage = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <MeaninglessHeader />

      <main className="flex flex-1 flex-col px-6 pb-[calc(5.625rem+1.5rem)] pt-2 md:px-10">
        <div className="pb-4 md:pb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-[1.75rem]">
            문제은행
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
            다양한 문제로 개념을 익혀보세요!
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 md:auto-rows-fr md:grid-cols-2 md:gap-4">
          <EntryButton
            icon={<MenuIcon src="/Questionbank.svg" />}
            title="문제은행"
            subtitle="내 강의자료로 만든 문제를 모아 풀어요"
            onClick={() => router.push("/questionbank/my-tasks")}
          />

          <EntryButton
            icon={<MenuIcon src="/AIQuestion.svg" />}
            title="AI 문제 생성"
            subtitle="AI를 이용하여 고품질 문제를 만들어 풀어보세요"
            onClick={() => router.push("/questionbank/premium")}
          />

          <EntryButton
            icon={<MenuIcon src="/Review.svg" />}
            title="복습하기"
            subtitle="이전에 풀었던 문제를 다시 풀어보세요"
            onClick={() => router.push("/questionbank/review")}
          />

          <EntryButton
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="10"
                  r="5.5"
                  stroke="#FF412E"
                  strokeWidth="1.5"
                />
                <path
                  d="M9.2 15L8.6 20L12 17.8L15.4 20L14.8 15"
                  stroke="#FF412E"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 10.1L11.2 11.3L14 8.6"
                  stroke="#FF412E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="수제 문제 제작"
            subtitle="준비 중입니다"
          />
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
};

export default QuestionBankPage;
