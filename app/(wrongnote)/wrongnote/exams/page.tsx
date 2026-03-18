"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader } from "@/components/molecules";
import type { WrongNoteExamListItem } from "@/types/wrongnote";

const ExamListPage = () => {
  const router = useRouter();
  const [exams, setExams] = useState<WrongNoteExamListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const raw = await fetchAPI("/api/wrong-notes/exams", "GET");
        const data = raw.data ?? raw;
        setExams(Array.isArray(data) ? data : (data.content ?? []));
      } catch {
        // 에러 처리
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="시험지 목록" showIcon />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">불러오는 중...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <p className="text-center text-muted-foreground">
              생성된 시험지가 없습니다.
            </p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              오답노트에서 AI 시험지를 생성해보세요.
            </p>
            <button
              className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white"
              onClick={() => router.push("/wrongnote/exams/generate")}
            >
              시험지 생성하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {exams.map((exam) => (
              <button
                key={exam.examId}
                className="flex items-center border-b px-6 py-4 text-left transition-colors active:bg-gray-50"
                onClick={() => router.push(`/wrongnote/exams/${exam.examId}`)}
              >
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-base font-medium text-foreground">
                    {exam.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{exam.questionCount}문제</span>
                    <span>
                      {new Date(exam.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    {exam.hasPdf && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">
                        PDF
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamListPage;
