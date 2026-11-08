"use client";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import EntryButton from "./_components/EntryButton";
import LearningSourceIcon from "@/components/learning/LearningSourceIcon";
import { useRouter } from "@/lib/navigation";
import { AppShell } from "@/components/molecules/AppShell";
import { GalleryVerticalEnd } from "lucide-react";
import PracticeResume from "@/components/learning/PracticeResume";
import RecentLearning from "@/components/learning/RecentLearning";

export default function QuestionBankPage() {
  const router = useRouter();
  return (
    <AppShell>
      <PracticeHeader title="문제 풀기" backHref="/" separator={false} />
      <main className="space-y-8 px-6 py-6">
        <PracticeResume />
        <section aria-labelledby="practice-options">
          <h2 id="practice-options" className="text-headline-small">
            새 문제 풀기
          </h2>
          <p className="sr-only">
            학습 형태 · 이미 푼 문제는 제외되고 틀린 문제는 약점공략에 쌓여요.
          </p>
          <div className="mt-4 space-y-3">
            {([
              [
                "수제 제작 문제",
                "과목과 세부주제를 골라 새 문제를 풀어요",
                "/questionbank/handcrafted",
                "HANDCRAFTED",
              ],
              [
                "AI 생성 문제",
                "주제나 학습자료로 문제를 만들어요",
                "/questionbank/generate",
                "AI",
              ],
              [
                "CBT 형태로 학습하기",
                "실전처럼 연습하고 결과를 확인해요",
                "/learning/cbt",
                "CBT",
              ],
            ] as const).map(([title, subtitle, path, source]) => (
              <EntryButton
                key={path}
                framed
                title={title}
                subtitle={subtitle}
                icon={<LearningSourceIcon source={source} />}
                onClick={() => router.push(path)}
              />
            ))}
          </div>
        </section>
        <section aria-labelledby="memory-options">
          <h2 id="memory-options" className="text-headline-small">
            암기 학습
          </h2>
          <div className="mt-4">
            <EntryButton
              framed
              title="AI 플래시카드"
              subtitle="카드를 넘기며 핵심 내용을 기억해요"
              icon={
                <GalleryVerticalEnd
                  aria-hidden="true"
                  className="h-6 w-6 text-primary"
                  strokeWidth={1.5}
                />
              }
              onClick={() => router.push("/flashcards")}
            />
          </div>
        </section>
        <RecentLearning />
      </main>
    </AppShell>
  );
}
