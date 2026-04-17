"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import LoadingOverlay from "../_components/LoadingOverlay";
import type {
  PdfUploadResponse,
  PdfExtractResponse,
  QuizStartResponse,
} from "@/types/questionbank";

const POLL_INTERVAL = 3000;
const PDF_MIME_TYPE = "application/pdf";
const PDF_ACCEPT = ".pdf,.PDF";

const GeneratePage = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<string>("10");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initSession = useSetAtom(initQuizSessionAtom);
  const abortRef = useRef(false);

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
  const isFormValid = file && parsedCount >= 1 && parsedCount <= 20;

  const handleGenerate = async () => {
    if (!isFormValid) return;
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
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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
      const quizRaw = await fetchAPI("/api/questionbank/quiz", "POST", {
        type: "PDF",
        taskId: extractResult.taskId,
      });
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      // 4) 세션 초기화 → 풀이 화면 이동
      initSession({
        sessionId: quizData.sessionId,
        sourceType: "PDF",
        title: "내 강의자료로 문제 생성",
        questions: quizData.questions.map((q) => ({
          id: q.id,
          questionType: q.type,
          passage: q.content,
          choices: mapChoices(q.choices),
          subject: q.subject,
          hint: q.hint,
        })),
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
    <div className="flex h-screen flex-col">
      <CustomHeader title="문제 생성" showIcon />

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-left transition-colors hover:border-brand hover:bg-brandSecondary">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF412E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="mt-4 text-base font-medium text-foreground">
            {file ? file.name : "자료를 업로드 해주세요."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            클릭하여 파일 선택
          </p>
          <input
            type="file"
            accept={PDF_ACCEPT}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* 문제 수 입력 */}
        <div className="mt-6 w-full">
          <h3 className="mb-2 text-base font-semibold text-foreground">
            문제 수
          </h3>
          <input
            type="number"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
            placeholder="문제 수를 입력하세요 (최대 20개)"
          />
        </div>
      </div>

      <div className="flex-shrink-0 px-6 pb-6">
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

export default GeneratePage;
