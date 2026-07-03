import { NotebookPen, Search } from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

import { QuestionBankPageNavigation } from "../_components/QuestionBankPageNavigation";

const filters = ["전체", "병태생리학 (샘플)", "약물학"];

export default function QuestionBankWrongNotesPage() {
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="nav"
      className="flex flex-col bg-white"
    >
      <MeaninglessHeader />

      <main className="flex min-h-[calc(100dvh-10rem)] flex-col px-6 pb-10 pt-6 md:px-8">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <NotebookPen
              aria-hidden="true"
              className="h-6 w-6"
              strokeWidth={2}
            />
          </span>
          <div className="min-w-0">
            <h1 className="text-[1.625rem] font-extrabold leading-8 text-foreground">
              오답 노트
            </h1>
            <p className="mt-1 text-[0.8125rem] leading-5 text-muted-foreground">
              0개 복습 대기 · 항목을 누르면 다시 풀어볼 수 있어요
            </p>
          </div>
        </header>

        <label className="mt-5 flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 shadow-[0_6px_16px_rgba(17,17,17,0.04)]">
          <Search
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
          />
          <span className="sr-only">오답 검색</span>
          <input
            type="search"
            placeholder="과목·주제·파일명 검색"
            className="h-full min-w-0 flex-1 bg-transparent text-[0.875rem] font-medium text-foreground outline-none placeholder:text-gray-500"
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={
                index === 0
                  ? "h-8 shrink-0 rounded-full bg-primary px-4 text-[0.8125rem] font-extrabold text-primary-foreground"
                  : "h-8 shrink-0 rounded-full border border-gray-300 bg-white px-4 text-[0.8125rem] font-extrabold text-muted-foreground"
              }
            >
              {filter}
            </button>
          ))}
        </div>

        <section className="flex flex-1 items-center justify-center pb-20 text-center">
          <div className="max-w-[24rem]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-muted-foreground">
              <NotebookPen
                aria-hidden="true"
                className="h-7 w-7"
                strokeWidth={1.8}
              />
            </span>
            <h2 className="mt-4 text-[1rem] font-extrabold text-foreground">
              아직 오답이 없어요
            </h2>
            <p className="mt-2 text-[0.8125rem] leading-5 text-muted-foreground">
              내 과목에서 자료를 업로드하고 문제를 풀어보세요. 틀린 문제는
              이곳에 자동으로 모입니다.
            </p>
          </div>
        </section>
      </main>
      <QuestionBankPageNavigation />
    </AppShell>
  );
}
