"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ImageMakerUploadShell } from "./_components/ImageMakerTabShell";

const examplePrompts = [
  "생물학 · 세포호흡",
  "유기화학 · 치환반응",
  "운영체제 · 스케줄링",
];

const toPixelNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resizeMaterialTextarea = (textarea: HTMLTextAreaElement) => {
  const style = window.getComputedStyle(textarea);
  const lineHeight = toPixelNumber(style.lineHeight) || 28;
  const verticalSpace =
    toPixelNumber(style.paddingTop) +
    toPixelNumber(style.paddingBottom) +
    toPixelNumber(style.borderTopWidth) +
    toPixelNumber(style.borderBottomWidth);
  const minHeight = Math.ceil(lineHeight * 3 + verticalSpace);
  const maxHeight = Math.max(minHeight, Math.floor(textarea.offsetWidth));

  textarea.style.height = `${minHeight}px`;
  textarea.style.overflowY = "hidden";

  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY =
    textarea.scrollHeight > maxHeight ? "auto" : "hidden";
};

export default function ImageMakerPage() {
  const materialTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [material, setMaterial] = useState("");
  const [fileName, setFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isMaterialFocused, setIsMaterialFocused] = useState(false);

  const hasMaterial = material.trim().length > 0 || fileName.length > 0;

  useEffect(() => {
    if (!materialTextareaRef.current) return;
    resizeMaterialTextarea(materialTextareaRef.current);
  }, [material]);

  useEffect(() => {
    const handleResize = () => {
      if (!materialTextareaRef.current) return;
      resizeMaterialTextarea(materialTextareaRef.current);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setStatusMessage("");
    event.target.value = "";
  };

  const handleClearFile = () => {
    setFileName("");
    setStatusMessage("");
  };

  const handleExampleClick = (prompt: string) => {
    setMaterial(
      `${prompt}\n\n핵심 개념과 흐름을 정리해서 서술형 답안으로 만들어주세요.`,
    );
    setStatusMessage("");
  };

  const handleGenerateClick = () => {
    if (!hasMaterial) {
      setStatusMessage("자료를 붙여넣거나 파일을 업로드해주세요.");
      return;
    }

    setStatusMessage("자료를 바탕으로 키워드 순서 배열을 준비 중이에요.");
  };

  return (
    <ImageMakerUploadShell activeTab="home">
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-gray-100 bg-background px-6">
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
            ref={materialTextareaRef}
            rows={3}
            value={material}
            onChange={(event) => {
              setMaterial(event.target.value);
              setStatusMessage("");
            }}
            onBlur={() => setIsMaterialFocused(false)}
            onFocus={() => setIsMaterialFocused(true)}
            onInput={(event) => resizeMaterialTextarea(event.currentTarget)}
            placeholder="교재의 한 단락, 강의 노트, 요약본을 붙여넣어 보세요."
            className="mt-6 w-full resize-none overflow-hidden rounded-[0.75rem] border border-gray-100 bg-muted px-6 py-6 text-base leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 sm:text-lg sm:leading-8"
            style={{
              borderColor: isMaterialFocused ? "#111111" : undefined,
            }}
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-brand bg-card px-4 text-sm font-bold text-brand transition-colors active:bg-brandSecondary sm:w-auto sm:px-6 sm:text-base">
              <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              파일 업로드
              <input
                type="file"
                accept="image/*,.pdf,.txt,application/pdf,text/plain"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {fileName && (
              <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full bg-brandSecondary py-1 pl-4 pr-2 text-sm font-semibold text-brand">
                <FileText aria-hidden="true" className="h-4 w-4" />
                <span className="min-w-0 flex-1 truncate">{fileName}</span>
                <button
                  type="button"
                  aria-label="선택한 파일 삭제"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-brand transition-colors active:bg-primary-900"
                  onClick={handleClearFile}
                >
                  <X aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </span>
            )}
          </div>

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
            서술형 문제 생성하기
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
      </main>
    </ImageMakerUploadShell>
  );
}
