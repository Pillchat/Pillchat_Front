"use client";
import { startQuiz } from "@/lib/client/startQuiz";
import Link from "next/link";
import FileIcon from "@/public/icons/file.svg";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI, getToken } from "@/lib/client/fetch";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import LoadingOverlay from "../../_components/LoadingOverlay";
import type {
  PdfUploadResponse,
  PdfExtractResponse,
  QuizStartResponse,
} from "@/types/questionbank";

const POLL_INTERVAL = 3000;
const PDF_MIME_TYPE = "application/pdf";
const PDF_ACCEPT = ".pdf,.PDF";

const PdfGeneratePage = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<string>("10");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initSession = useSetAtom(initQuizSessionAtom);
  const abortRef = useRef(false);
  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
    };
  }, []);

  const isPdfFile = (selected: File) => {
    const normalizedName = selected.name.toLowerCase();

    if (!normalizedName.endsWith(".pdf")) {
      return false;
    }

    return !selected.type || selected.type === PDF_MIME_TYPE;
  };

  const applySelectedFile = (selected: File | null) => {
    if (selected && isPdfFile(selected)) {
      setFile(selected);
      setError(null);
      return;
    }

    if (selected) {
      setFile(null);
      setError("PDF 파일만 업로드할 수 있습니다.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    applySelectedFile(selected ?? null);
    e.target.value = "";
  };

  const parsedCount = Number(questionCount);
  const isFormValid =
    file &&
    Number.isInteger(parsedCount) &&
    parsedCount >= 1 &&
    parsedCount <= 20;

  const handleGenerate = async () => {
    if (isLoading || !isFormValid) return;
    setIsLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      // 1) PDF 업로드 (questionCount 포함)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", parsedCount.toString());

      const uploadRes = await fetch("/api/questionbank/pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("PDF 업로드에 실패했습니다.");
      const uploadRaw = await uploadRes.json();
      const uploadData: PdfUploadResponse = uploadRaw.data ?? uploadRaw;

      const fileId = uploadData.fileId;
      if (!fileId)
        throw new Error("PDF 업로드 응답에서 fileId를 받지 못했습니다.");

      // 2) 단일 폴링: PDF 추출(status "DONE") → 문제 생성(taskStatus "COMPLETED")
      let extractResult: PdfExtractResponse | null = null;

      while (!abortRef.current) {
        const extractRaw = await fetchAPI(
          `/api/questionbank/pdf/${fileId}/extract`,
          "GET",
        );
        const extractData: PdfExtractResponse = extractRaw.data ?? extractRaw;

        if (extractData.status === "FAILED") {
          throw new Error("PDF 텍스트 추출에 실패했습니다.");
        }

        if (extractData.status === "DONE") {
          if (extractData.taskStatus === "COMPLETED" && extractData.questions) {
            extractResult = extractData;
            break;
          }
          if (extractData.taskStatus === "FAILED") {
            throw new Error("문제 생성에 실패했습니다.");
          }
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }

      if (abortRef.current) throw new Error("취소됨");
      if (!extractResult) throw new Error("문제 생성 결과를 받지 못했습니다.");

      // 3) 퀴즈 세션 시작
      const quizRaw = await startQuiz({
        type: "PDF",
        taskId: extractResult.taskId,
      });
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;
      const answerByQuestionId = new Map(
        (extractResult.questions ?? []).map((question) => [
          question.id,
          question,
        ]),
      );

      if (abortRef.current) return;
      // 4) 세션 초기화 → 풀이 화면 이동
      initSession({
        sessionId: quizData.sessionId,
        sourceType: "PDF",
        title: "내 강의자료로 문제 생성",
        questions: quizData.questions.map((q) => {
          const answer = answerByQuestionId.get(q.id);
          const quizQuestion = q as typeof q & {
            answer?: string;
            correctAnswer?: string;
            explanation?: string | null;
          };

          return {
            id: q.id,
            questionType: q.type,
            passage: q.content,
            choices: mapChoices(q.choices),
            subject: q.subject,
            hint: q.hint,
            correctAnswer:
              answer?.answer ??
              quizQuestion.answer ??
              quizQuestion.correctAnswer,
            explanation:
              answer?.explanation ?? quizQuestion.explanation ?? undefined,
          };
        }),
      });
      router.push("/questionbank/solve");
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err.message || "오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <CustomHeader title="PDF로 문제 만들기" showIcon />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-6">
        <p className="mb-6 w-full text-body-medium text-muted-foreground">
          학습자료의 내용을 바탕으로 AI가 문제를 만들어요.
        </p>
        <div className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl bg-gray-50 px-6 py-12 text-left transition-colors focus-within:ring-2 focus-within:ring-primary hover:bg-primary-980">
          <FileIcon aria-hidden="true" className="h-8 w-8" />
          <p className="mt-4 text-base font-medium text-foreground">
            {file ? file.name : "PDF 파일을 선택해 주세요."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            클릭하여 파일 선택
          </p>
          <input
            type="file"
            aria-label="PDF 파일"
            accept={PDF_ACCEPT}
            disabled={isLoading}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* 문제 수 입력 */}
        <div className="mt-6 w-full">
          <label
            htmlFor="pdf-question-count"
            className="mb-2 block text-base font-semibold text-foreground"
          >
            문제 수
          </label>
          <input
            id="pdf-question-count"
            type="number"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand"
            placeholder="문제 수를 입력하세요 (최대 20개)"
          />
        </div>
        {!isLoading && (
          <Link
            href="/questionbank/generate"
            className="mt-6 text-body-medium font-medium text-primary"
          >
            생성 방식 다시 선택
          </Link>
        )}
      </div>

      <div className="flex-shrink-0 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SolidButton
          content="문제 생성"
          disabled={!isFormValid || isLoading}
          variant={isFormValid && !isLoading ? "brand" : "disabled"}
          onClick={handleGenerate}
        />
      </div>
      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default PdfGeneratePage;
