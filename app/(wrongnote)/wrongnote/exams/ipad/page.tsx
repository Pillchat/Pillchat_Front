"use client";

import Link from "next/link";
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Sparkles,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ExamTab = "generate" | "grade";
type Difficulty = "하" | "중" | "상" | "최상";

type QuestionDialProps = {
  title: string;
  description: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
};

type UploadBoxProps = {
  id: string;
  title: string;
  description: string;
  accept: string;
  file: File | null;
  iconType: "file" | "image";
  hint?: string;
  onFileChange: (file: File | null) => void;
};

const difficulties: Difficulty[] = ["하", "중", "상", "최상"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function QuestionDial({
  title,
  description,
  value,
  max,
  onChange,
}: QuestionDialProps) {
  const [isDragging, setIsDragging] = useState(false);
  const progress = max === 0 ? 0 : value / max;
  const angle = clamp(progress, 0, 1) * 300;
  const knobAngle = (210 + angle) % 360;
  const knobRadians = (knobAngle * Math.PI) / 180;
  const knobRadius = 50;

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const degreesFromTop =
      ((Math.atan2(deltaX, -deltaY) * 180) / Math.PI + 360) % 360;
    let arcDegrees = degreesFromTop - 210;

    if (arcDegrees < 0) {
      arcDegrees += 360;
    }

    onChange(Math.round((clamp(arcDegrees, 0, 300) / 300) * max));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromPointer(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointer(event);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clamp(value + 1, 0, max));
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(clamp(value - 1, 0, max));
    }
  };

  return (
    <section className="touch-none select-none rounded-[22px] border border-gray-100 bg-white px-6 py-6 shadow-[0_12px_28px_rgba(17,17,17,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
        <p className="text-[12px] font-medium text-muted-foreground">
          {description}
        </p>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${title} 수 조절`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative mx-auto mt-3 h-[148px] w-[148px] cursor-grab touch-none rounded-full active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from -150deg, hsl(var(--brand)) ${angle}deg, hsl(var(--gray-100)) ${angle}deg 300deg, transparent 300deg 360deg)`,
          }}
        />
        <div className="absolute inset-[14px] rounded-full bg-white" />
        <div
          aria-hidden="true"
          className="absolute h-[22px] w-[22px] rounded-full border-[4px] border-brand bg-white shadow-[0_2px_8px_rgba(17,17,17,0.16)]"
          style={{
            left: `${50 + knobRadius * Math.sin(knobRadians)}%`,
            top: `${50 - knobRadius * Math.cos(knobRadians)}%`,
            transform: "translate(-50%, -50%)",
          }}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
          <strong className="text-[34px] font-extrabold leading-none text-foreground">
            {value}
          </strong>
          <span className="mt-2 text-[13px] font-medium text-muted-foreground">
            문항
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] font-medium text-muted-foreground">
        드래그로 조절
      </p>
    </section>
  );
}

function UploadBox({
  id,
  title,
  description,
  accept,
  file,
  iconType,
  hint,
  onFileChange,
}: UploadBoxProps) {
  const Icon = iconType === "image" ? ImageIcon : Upload;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onFileChange(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="flex min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-gray-300 bg-white px-8 py-8 text-center transition-colors active:bg-brandSecondary"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brandSecondary text-brand">
        <Icon aria-hidden="true" className="h-8 w-8" strokeWidth={1.8} />
      </span>
      <span className="mt-5 text-[18px] font-bold text-foreground">
        {file ? file.name : title}
      </span>
      <span className="mt-2 text-[13px] font-medium text-muted-foreground">
        {description}
      </span>
      {hint && (
        <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-brand">
          <Upload aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          {hint}
        </span>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}

export default function IpadExamManagerPage() {
  const [activeTab, setActiveTab] = useState<ExamTab>("generate");
  const [subjectName, setSubjectName] = useState("경제학원론");
  const [oxCount, setOxCount] = useState(30);
  const [multipleChoiceCount, setMultipleChoiceCount] = useState(8);
  const [essayCount, setEssayCount] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("중");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [answerSheetImage, setAnswerSheetImage] = useState<File | null>(null);

  const totalCount = useMemo(
    () => oxCount + multipleChoiceCount + essayCount,
    [essayCount, multipleChoiceCount, oxCount],
  );

  return (
    <main className="min-h-screen bg-white text-foreground">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-[834px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bran shadow-[0_8px_18px_rgba(255,65,46,0.18)]">
            <Link
            href="/questionbank"
            aria-label="학습 페이지로 이동"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          </div>
          <div>
            <h1 className="text-[19px] font-extrabold tracking-normal">
              AI 스마트 시험 매니저
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
              강의 → 시험지 → 채점 → 리포트
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[834px] px-5 pb-16 pt-8 md:px-8">
        <div
          role="tablist"
          aria-label="시험지 작업"
          className="mx-auto grid h-16 max-w-[460px] grid-cols-2 rounded-[24px] bg-gray-100 p-1 shadow-[0_12px_28px_rgba(17,17,17,0.06)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "generate"}
            onClick={() => setActiveTab("generate")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[20px] text-[15px] font-bold text-muted-foreground transition-all",
              activeTab === "generate" &&
                "bg-white text-foreground shadow-[0_8px_18px_rgba(17,17,17,0.08)]",
            )}
          >
            <FileText
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.8}
            />
            시험지 생성
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "grade"}
            onClick={() => setActiveTab("grade")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[20px] text-[15px] font-bold text-muted-foreground transition-all",
              activeTab === "grade" &&
                "bg-white text-foreground shadow-[0_8px_18px_rgba(17,17,17,0.08)]",
            )}
          >
            <ClipboardCheck
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.8}
            />
            시험지 채점
          </button>
        </div>

        {activeTab === "generate" ? (
          <section
            role="tabpanel"
            aria-label="시험지 생성"
            className="mt-8 space-y-6"
          >
            <div className="rounded-[24px] border border-gray-100 bg-white px-6 py-7 shadow-[0_12px_28px_rgba(17,17,17,0.06)]">
              <label
                htmlFor="subjectName"
                className="text-[16px] font-extrabold text-foreground"
              >
                과목명
              </label>
              <input
                id="subjectName"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                className="mt-3 h-14 w-full rounded-[14px] border border-gray-300 bg-white px-4 text-[17px] font-medium text-foreground outline-none transition-colors placeholder:text-gray-500 focus:border-brand"
                placeholder="과목명을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <QuestionDial
                title="O/X 문제"
                description="참 · 거짓"
                value={oxCount}
                max={30}
                onChange={setOxCount}
              />
              <QuestionDial
                title="객관식"
                description="4지선다"
                value={multipleChoiceCount}
                max={30}
                onChange={setMultipleChoiceCount}
              />
              <QuestionDial
                title="서술형"
                description="키워드 채점"
                value={essayCount}
                max={30}
                onChange={setEssayCount}
              />
            </div>

            <section className="rounded-[24px] border border-gray-100 bg-white px-6 py-7 shadow-[0_12px_28px_rgba(17,17,17,0.06)]">
              <h2 className="text-[16px] font-extrabold text-foreground">
                난이도
              </h2>
              <div className="mt-4 grid h-[52px] grid-cols-4 rounded-[18px] bg-gray-100 p-1">
                {difficulties.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={difficulty === item}
                    onClick={() => setDifficulty(item)}
                    className={cn(
                      "rounded-[15px] text-[15px] font-bold text-muted-foreground transition-all",
                      difficulty === item &&
                        "bg-brandSecondary text-brand shadow-[0_8px_18px_rgba(255,65,46,0.12)]",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <UploadBox
              id="sourceFile"
              title="강의 자료를 드래그하거나 클릭해서 업로드"
              description="PDF · TXT · 최대 20MB"
              accept=".pdf,.PDF,.txt,.TXT"
              file={sourceFile}
              iconType="file"
              onFileChange={setSourceFile}
            />

            <button
              type="button"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-brand text-[18px] font-extrabold text-white shadow-[0_14px_28px_rgba(255,65,46,0.18)] transition-transform active:scale-[0.99]"
            >
              <Sparkles
                aria-hidden="true"
                className="h-6 w-6"
                strokeWidth={1.9}
              />
              PDF 시험지 생성 ({totalCount}문항)
            </button>
          </section>
        ) : (
          <section
            role="tabpanel"
            aria-label="시험지 채점"
            className="mt-8 space-y-7"
          >
            <UploadBox
              id="answerSheetImage"
              title="손글씨로 푼 시험지 사진 업로드"
              description="JPG · PNG · 최대 20MB"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png,.JPG,.JPEG,.PNG"
              file={answerSheetImage}
              iconType="image"
              hint="클릭 또는 드래그"
              onFileChange={setAnswerSheetImage}
            />

            <button
              type="button"
              disabled={!answerSheetImage}
              className={cn(
                "flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[18px] font-extrabold text-white shadow-[0_14px_28px_rgba(255,65,46,0.18)] transition-transform active:scale-[0.99]",
                answerSheetImage
                  ? "bg-brand shadow-[0_14px_28px_rgba(255,65,46,0.18)]"
                  : "cursor-not-allowed bg-gray-100 text-gray-500 shadow-none",
              )}
            >
              <Sparkles
                aria-hidden="true"
                className="h-6 w-6"
                strokeWidth={1.9}
              />
              채점 시작
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
