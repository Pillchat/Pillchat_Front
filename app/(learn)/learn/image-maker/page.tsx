"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useState } from "react";
import { ArrowRight, FileText, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ImageMakerUploadShell } from "./_components/ImageMakerTabShell";

const examplePrompts = [
  "생물학 · 세포호흡",
  "유기화학 · 치환반응",
  "운영체제 · 스케줄링",
];

const guideSteps = [
  {
    number: "01",
    title: "자료 업로드",
    description: "붙여넣기 또는 파일 업로드",
  },
  {
    number: "02",
    title: "키워드 순서 배열",
    description: "논리의 뼈대를 먼저 잡기",
  },
  {
    number: "03",
    title: "그림 보고 서술",
    description: "연상 이미지로 답안 작성",
  },
];

export default function ImageMakerPage() {
  const [material, setMaterial] = useState("");
  const [fileName, setFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const hasMaterial = material.trim().length > 0 || fileName.length > 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setStatusMessage("");
    event.target.value = "";
  };

  const handleExampleClick = (prompt: string) => {
    setMaterial(
      `${prompt}\n\n핵심 개념과 흐름을 정리해서 서술형 답안으로 만들어주세요.`,
    );
    setStatusMessage("");
  };

  const handleGenerateClick = () => {
    if (!hasMaterial) {
      setStatusMessage("자료를 붙여넣거나 PDF · TXT 파일을 업로드해주세요.");
      return;
    }

    setStatusMessage("자료를 바탕으로 키워드 순서 배열을 준비 중이에요.");
  };

  return (
    <ImageMakerUploadShell activeTab="home">
      <header className="sticky top-0 z-30 flex h-[4.75rem] items-center justify-between border-b border-gray-100 bg-background px-6">
        <Link href="/" aria-label="홈으로 이동" className="flex items-center">
          <Image
            src="/brand/PillChat.svg"
            alt="PillChat"
            width={88}
            height={34}
            priority
          />
        </Link>

        <Link
          href="/mypage"
          aria-label="프로필로 이동"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-card"
        >
          <Image
            src="/icons/defaultProfile.svg"
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[40rem] flex-col px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <section
          aria-labelledby="image-maker-title"
          className="rounded-[2rem] border border-gray-100 bg-card px-6 py-8 shadow-[0_1rem_2.5rem_rgba(17,17,17,0.06)] md:px-8"
        >
          <h1
            id="image-maker-title"
            className="text-xl font-bold text-foreground"
          >
            자료 붙여넣기
          </h1>

          <textarea
            value={material}
            onChange={(event) => {
              setMaterial(event.target.value);
              setStatusMessage("");
            }}
            placeholder="교재의 한 단락, 강의 노트, 요약본을 붙여넣어 보세요."
            className="mt-6 h-[22rem] w-full resize-none rounded-[1.75rem] border border-gray-100 bg-muted px-6 py-6 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 sm:text-lg sm:leading-8"
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-brand bg-card px-4 text-sm font-bold text-brand transition-colors active:bg-brandSecondary sm:w-auto sm:px-6 sm:text-base">
              <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              PDF · TXT 업로드
              <input
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {fileName && (
              <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full bg-brandSecondary px-4 text-sm font-semibold text-brand">
                <FileText aria-hidden="true" className="h-4 w-4" />
                <span className="truncate">{fileName}</span>
              </span>
            )}
          </div>

          <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
            PDF는 텍스트 추출 후 데모용 요약이 생성돼요.
          </p>

          <div className="mt-10">
            <h2 className="text-base font-bold text-muted-foreground">
              예시로 시작해보기
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleExampleClick(prompt)}
                  className="min-h-11 rounded-full bg-brandSecondary px-5 text-sm font-bold text-brand transition-colors active:bg-primary-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="mt-10 h-16 w-full gap-2 rounded-full bg-brand px-4 text-base font-bold shadow-[0_0.5rem_1rem_rgba(255,65,46,0.24)] hover:bg-primary-800 active:bg-primary-800 sm:gap-3 sm:text-lg"
            onClick={handleGenerateClick}
          >
            <Sparkles aria-hidden="true" className="!h-6 !w-6" />
            서술형 문제 3개 생성하기
            <ArrowRight aria-hidden="true" className="!h-6 !w-6" />
          </Button>

          {statusMessage && (
            <p
              className={cn(
                "mt-4 text-center text-sm font-semibold",
                hasMaterial ? "text-brand" : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {statusMessage}
            </p>
          )}
        </section>

        <section aria-labelledby="usage-guide-title" className="mt-6">
          <h2
            id="usage-guide-title"
            className="text-base font-bold text-foreground"
          >
            사용법
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {guideSteps.map((step) => (
              <li
                key={step.number}
                className="grid grid-cols-[3.25rem_1fr] gap-4 border-b border-gray-100 py-4 last:border-b-0"
              >
                <span className="text-lg font-extrabold text-brand">
                  {step.number}.
                </span>
                <span>
                  <strong className="block text-base font-bold text-foreground">
                    {step.title}
                  </strong>
                  <span className="mt-1 block text-sm font-medium leading-5 text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </ImageMakerUploadShell>
  );
}
