"use client";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import EntryButton from "./_components/EntryButton";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import { useRouter } from "@/lib/navigation";
import RecentLearning from "@/components/learning/RecentLearning";

export default function QuestionBankPage() {
  const router = useRouter();
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <PracticeHeader title="문제 풀기" backHref="/" />
      <main className="space-y-6 px-6 py-6">
        <p className="rounded-xl bg-primary-980 p-4 text-body-medium">
          새 문제는 한 번도 풀지 않은 문제만 출제돼요. 이미 푼 문제는 자동으로
          제외되고, 틀린 문제는 약점공략에 쌓여요.
        </p>
        <div className="divide-y divide-border">
          {[
            [
              "수제 제작 문제",
              "과목과 세부주제를 골라 새 문제를 풀어요",
              "/questionbank/handcrafted",
            ],
            [
              "AI 생성 문제",
              "주제나 학습자료로 문제를 만들어요",
              "/questionbank/generate",
            ],
            [
              "CBT 형태로 학습하기",
              "실전처럼 연습하고 결과를 확인해요",
              "/learning/cbt",
            ],
          ].map(([title, subtitle, path]) => (
            <EntryButton
              key={path}
              title={title}
              subtitle={subtitle}
              icon={
                <QuestionBankIcon
                  aria-hidden="true"
                  className="h-8 w-8 text-primary"
                />
              }
              onClick={() => router.push(path)}
            />
          ))}
        </div>
        <RecentLearning />
      </main>
    </div>
  );
}
