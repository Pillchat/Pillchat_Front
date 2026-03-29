"use client";

import { useRouter } from "next/navigation";
import { MeaninglessHeader, BottomNavbar } from "@/components/molecules";
import EntryButton from "./_components/EntryButton";

const QuestionBankPage = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <MeaninglessHeader />

      {/* 상단 안내 영역 */}
      <div className="px-6 pb-4 pt-2">
        <h1 className="text-2xl font-bold text-foreground">문제은행</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          다양한 문제로 개념을 익혀보세요!
        </p>
      </div>

      {/* 4가지 진입 버튼 */}
      <div className="flex flex-1 flex-col gap-3 px-6 pb-[5.625rem]">
        <EntryButton
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF412E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          }
          title="내 강의자료로 문제 생성"
          subtitle="PDF 강의자료를 업로드하면 AI가 문제를 만들어줘요"
          onClick={() => router.push("/questionbank/my-tasks")}
        />

        <EntryButton
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF412E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          title="고퀄리티 AI 문제 제작"
          subtitle="AI를 이용하여 고품질 문제를 만들어 풀어보세요"
          onClick={() => router.push("/questionbank/premium")}
        />

        <EntryButton
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF412E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
          title="복습하기"
          subtitle="이전에 풀었던 문제를 다시 풀어보세요"
          onClick={() => router.push("/questionbank/review")}
        />

        <EntryButton
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="240"
              height="240"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="10"
                r="5.5"
                stroke="#FF412E"
                stroke-width="1"
              />
              <path
                d="M9.2 15L8.6 20L12 17.8L15.4 20L14.8 15"
                stroke="#FF412E"
                stroke-width="1"
                stroke-linejoin="round"
              />
              <path
                d="M10 10.1L11.2 11.3L14 8.6"
                stroke="#FF412E"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          title="수제 문제 제작"
          subtitle="준비 중입니다"
          onClick={() => {}}
        />
      </div>

      <BottomNavbar />
    </div>
  );
};

export default QuestionBankPage;
