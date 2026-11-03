"use client";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import EntryButton from "./_components/EntryButton";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import { useRouter } from "@/lib/navigation";
import { AppShell } from "@/components/molecules/AppShell";
import { Layers } from "lucide-react";
import RecentLearning from "@/components/learning/RecentLearning";

export default function QuestionBankPage() {
  const router = useRouter();
  return (
    <AppShell>
      <PracticeHeader title="문제 풀기" backHref="/" separator={false} />
      <main className="space-y-6 px-6 py-6">
        <p className="rounded-xl bg-primary-980 p-4 text-body-medium">
          새 문제는 한 번도 풀지 않은 문제만 출제돼요. 이미 푼 문제는 자동으로
          제외되고, 틀린 문제는 약점공략에 쌓여요.
        </p>
        <section
          aria-labelledby="practice-options"
          className="rounded-2xl bg-gray-50 p-4"
        >
          <h2 id="practice-options" className="text-headline-small">
            학습 형태
          </h2>
          <div>
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
        </section>
        <section aria-labelledby="memory-options">
          <h2 id="memory-options" className="text-headline-small">
            암기 학습
          </h2>
          <EntryButton
            title="AI 플래시카드"
            subtitle="카드를 넘기며 핵심 내용을 기억해요"
            icon={
              <Layers
                aria-hidden="true"
                className="h-8 w-8 text-primary"
                size={32}
                strokeWidth={2}
                absoluteStrokeWidth
              />
            }
            onClick={() => router.push("/flashcards")}
          />
        </section>
        <RecentLearning />
      </main>
    </AppShell>
  );
}
