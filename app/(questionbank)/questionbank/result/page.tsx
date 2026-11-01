"use client";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { quizSessionAtom } from "@/store/quizSession";
import { fetchAPI } from "@/lib/client/fetch";
import { completeDailyQuest } from "@/lib/client/dailyQuest";
import { CustomHeader } from "@/components/molecules";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import AiPracticeResult from "@/components/learning/AiPracticeResult";
import type { QuizResultResponse } from "@/types/questionbank";
import Link from "next/link";
export default function ResultPage() {
  const session = useAtomValue(quizSessionAtom);
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const id =
      new URLSearchParams(window.location.search).get("session") ??
      session?.sessionId;
    if (!id) {
      setError("응시 정보가 없습니다. 학습 기록에서 결과를 선택해 주세요.");
      return;
    }
    setError("");
    void fetchAPI(
      `/api/questionbank/quiz/${encodeURIComponent(String(id))}`,
      "GET",
    )
      .then((raw) => {
        if (active) setResult(raw.data ?? raw);
        if ((raw.data ?? raw).type === "PDF")
          completeDailyQuest("subject-study");
      })
      .catch(() => {
        if (active) setError("결과를 불러오지 못했어요. 다시 시도해 주세요.");
      });
    return () => {
      active = false;
    };
  }, [session?.sessionId, retry]);
  if (result) return <AiPracticeResult result={result} />;
  return (
    <>
      <CustomHeader title="학습 결과" />
      <main className="space-y-4 p-6">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="text-primary"
            >
              다시 불러오기
            </button>
            <Link href="/learning/history" className="block">
              전체 학습 기록
            </Link>
          </>
        ) : (
          <LoadingIndicator label="결과를 불러오는 중..." />
        )}
      </main>
    </>
  );
}
