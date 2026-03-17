"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader } from "@/components/molecules";
import type { WrongNoteExam } from "@/types/wrongnote";

const ExamDetailPage = () => {
  const params = useParams();
  const examId = params.examId as string;
  const [exam, setExam] = useState<WrongNoteExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const raw = await fetchAPI(`/api/wrong-notes/exams/${examId}`, "GET");
        const data: WrongNoteExam = raw.data ?? raw;
        setExam(data);
      } catch {
        // 에러 처리
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  const handleDownloadPdf = async () => {
    if (!exam?.pdfS3Key || downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/wrong-notes/exams/${examId}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam.title || "exam"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF 다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-screen flex-col">
        <CustomHeader title="시험지" showIcon />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">시험지를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => a.questionOrder - b.questionOrder,
  );

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="시험지" showIcon />

      <div className="flex-1 overflow-y-auto">
        {/* 시험지 정보 */}
        <div className="border-b px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{exam.questionCount}문제</span>
            <span>
              {new Date(exam.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                showAnswers
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-muted-foreground"
              }`}
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? "정답 숨기기" : "정답 보기"}
            </button>
            {exam.pdfS3Key && (
              <button
                className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloading ? "다운로드 중..." : "PDF"}
              </button>
            )}
          </div>
        </div>

        {/* 문제 목록 */}
        <div className="flex flex-col">
          {sortedQuestions.map((q, i) => (
            <div key={q.id} className="border-b px-6 py-4">
              <div className="mb-2 flex items-start gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="flex-1 whitespace-pre-wrap text-base leading-relaxed text-foreground">
                  {q.content}
                </p>
              </div>

              {/* 보기 (객관식) */}
              {q.choices && q.choices.length > 0 && (
                <div className="ml-8 mt-2 flex flex-col gap-1.5">
                  {q.choices.map((choice, ci) => (
                    <p key={ci} className="text-sm text-foreground">
                      {ci + 1}. {choice}
                    </p>
                  ))}
                </div>
              )}

              {/* 출처 */}
              {q.sourceSubject && (
                <p className="ml-8 mt-2 text-xs text-muted-foreground">
                  출처: {q.sourceSubject}
                </p>
              )}

              {/* 정답 & 해설 */}
              {showAnswers && (
                <div className="ml-8 mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-brand">
                    정답: {q.answer}
                  </p>
                  {q.explanation && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamDetailPage;
