import Link from "next/link";
import { ChevronRight, Edit3, Folder, Plus } from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

import { QuestionBankPageNavigation } from "../_components/QuestionBankPageNavigation";

const subjects = [
  {
    id: "pathophysiology",
    name: "병태생리학 (샘플)",
    materialCount: 1,
    iconClassName: "bg-primary-980 text-primary",
  },
  {
    id: "pharmacology",
    name: "약물학",
    materialCount: 1,
    iconClassName: "bg-gray-100 text-gray-800",
  },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-[24px] border border-gray-300 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(17,17,17,0.06)]">
      <p className="text-[0.8125rem] font-medium text-muted-foreground">
        {label}
      </p>
      <strong className="mt-2 block text-[1.375rem] font-extrabold leading-none text-foreground">
        {value}
      </strong>
    </section>
  );
}

export default function QuestionBankSubjectsPage() {
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="nav"
      className="flex flex-col bg-white"
    >
      <MeaninglessHeader />

      <main className="px-6 pb-10 pt-6 md:px-8">
        <header>
          <h1 className="text-[1.625rem] font-extrabold leading-9 text-foreground">
            이번 학기 과목
          </h1>
          <p className="mt-2 text-[0.8125rem] leading-5 text-muted-foreground">
            학습할 과목을 폴더로 정리하고, 자료를 추가해 두면 오늘의 퀘스트에
            자동 반영됩니다.
          </p>
        </header>

        <section
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
          aria-label="과목 요약"
        >
          <StatCard label="등록 과목" value="2개" />
          <StatCard label="업로드 자료" value="2개" />
        </section>

        <button
          type="button"
          className="mt-5 flex h-[3.625rem] w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-primary-800 bg-primary-980 text-[0.9375rem] font-extrabold text-primary active:scale-[0.99]"
        >
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />새
          과목 폴더 추가
        </button>

        <section className="mt-4 flex flex-col gap-3" aria-label="과목 목록">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href="/questionbank/generate"
              className="flex min-h-[5.5rem] items-center gap-4 rounded-[24px] border border-gray-300 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(17,17,17,0.06)] transition-transform active:scale-[0.99] md:px-5"
              prefetch={false}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${subject.iconClassName}`}
              >
                <Folder
                  aria-hidden="true"
                  className="h-7 w-7"
                  strokeWidth={1.9}
                />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[1rem] font-extrabold text-foreground">
                  {subject.name}
                </strong>
                <span className="mt-1 block text-[0.8125rem] font-medium text-muted-foreground">
                  자료 {subject.materialCount}개
                </span>
              </span>

              <span className="flex items-center gap-5 text-gray-800">
                <Edit3
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
                <ChevronRight
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
              </span>
            </Link>
          ))}
        </section>
      </main>
      <QuestionBankPageNavigation />
    </AppShell>
  );
}
