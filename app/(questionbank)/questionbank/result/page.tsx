"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { quizSessionAtom, clearQuizSessionAtom } from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import DonutChart from "../_components/DonutChart";
import StatsCard from "../_components/StatsCard";
import type { QuizResultResponse } from "@/types/questionbank";

interface TopicBreakdown {
  topic: string;
  total: number;
  correct: number;
}

const ResultPage = () => {
  const router = useRouter();
  const session = useAtomValue(quizSessionAtom);
  const clearSession = useSetAtom(clearQuizSessionAtom);
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace("/questionbank");
      return;
    }

    const fetchResult = async () => {
      try {
        const raw = await fetchAPI(
          `/api/questionbank/quiz/${session.sessionId}`,
          "GET",
        );
        const data: QuizResultResponse = raw.data ?? raw;
        setResult(data);
      } catch {
        // API 실패 시 로컬 데이터로 폴백
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [session, router]);

  if (!session) return null;

  const totalCount = result?.questionCount ?? session.questions.length;
  const correctCount =
    result?.correctCount ??
    Object.values(session.results).filter((r) => r.isCorrect).length;
  const wrongCount = totalCount - correctCount;
  const skippedCount = Object.values(session.results).filter(
    (r) => r.selectedChoiceId === null,
  ).length;
  const accuracy =
    result?.scorePercent ??
    (totalCount > 0 ? (correctCount / totalCount) * 100 : 0);

  const topicBreakdown: TopicBreakdown[] = (() => {
    if (result?.answers) {
      const topicMap = new Map<string, TopicBreakdown>();
      result.answers.forEach((a) => {
        const topic = a.subject;
        const existing = topicMap.get(topic) || {
          topic,
          total: 0,
          correct: 0,
        };
        existing.total++;
        if (a.isCorrect) existing.correct++;
        topicMap.set(topic, existing);
      });
      return Array.from(topicMap.values());
    }
    const topicMap = new Map<string, TopicBreakdown>();
    session.questions.forEach((q) => {
      const topic = q.topic || q.subject;
      const existing = topicMap.get(topic) || {
        topic,
        total: 0,
        correct: 0,
      };
      existing.total++;
      const r = session.results[q.id];
      if (r?.isCorrect) existing.correct++;
      topicMap.set(topic, existing);
    });
    return Array.from(topicMap.values());
  })();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">결과 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="문제풀이 결과" showIcon />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-6 text-center text-base font-semibold text-foreground">
          {session.title}
        </p>

        <div className="mb-6 flex justify-center">
          <DonutChart percentage={accuracy} />
        </div>

        <div className="mb-6 flex gap-3">
          <StatsCard label="총 문제" value={totalCount} />
          <StatsCard label="정답" value={correctCount} color="green" />
          <StatsCard label="오답" value={wrongCount} color="red" />
          <StatsCard label="생략" value={skippedCount} color="gray" />
        </div>

        <div className="rounded-xl border">
          <div className="flex items-center border-b px-4 py-3">
            <span className="flex-1 text-sm font-semibold text-foreground">
              주제
            </span>
            <span className="w-20 text-center text-sm font-semibold text-foreground">
              맞은 문제
            </span>
          </div>
          {topicBreakdown.map((stat) => (
            <div
              key={stat.topic}
              className="flex items-center border-b px-4 py-3 last:border-b-0"
            >
              <span className="flex-1 text-sm text-foreground">
                {stat.topic}
              </span>
              <span className="w-20 text-center text-sm text-muted-foreground">
                {stat.correct}/{stat.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 border-t bg-white px-6 pb-6 pt-3">
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-xl border border-gray-200 py-3.5 text-base font-medium text-foreground"
            onClick={() => {
              clearSession();
              router.push("/questionbank");
            }}
          >
            홈으로
          </button>
          <button
            className="flex-1 rounded-xl bg-brand py-3.5 text-base font-medium text-white"
            onClick={() => {
              clearSession();
              router.push("/questionbank/review");
            }}
          >
            복습하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
