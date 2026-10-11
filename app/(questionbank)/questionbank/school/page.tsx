"use client";

import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

import { AppShell } from "@/components/molecules";
import { useRouter } from "@/lib/navigation";

type Difficulty = "하" | "중" | "상" | "최상";
type ExamTab = "generate" | "grade";
type QuestionType = "ox" | "choice" | "essay";
type ExamQuestion = {
  id: string;
  type: QuestionType;
  unit: string;
  prompt: string;
  choices?: string[];
  answer: string;
  keywords?: string[];
  explanation: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function QuestionDial({
  title,
  value,
  max,
  onChange,
}: {
  title: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const angle = (value / max) * 300;
  const knobAngle = ((210 + angle) * Math.PI) / 180;

  const updateValue = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const fromTop = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    const arc = fromTop < 210 ? fromTop + 150 : fromTop - 210;
    onChange(Math.round((clamp(arc, 0, 300) / 300) * max));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowUp", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      onChange(clamp(value + 1, 0, max));
    }
    if (["ArrowDown", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      onChange(clamp(value - 1, 0, max));
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-4 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${title} 문항 수`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          updateValue(event);
        }}
        onPointerMove={(event) => dragging && updateValue(event)}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setDragging(false);
        }}
        className="relative mx-auto mt-3 h-24 w-24 touch-none rounded-full"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from -150deg, hsl(var(--brand)) ${angle}deg, hsl(var(--gray-100)) ${angle}deg 300deg, transparent 300deg)`,
          }}
        />
        <div className="absolute inset-2.5 rounded-full bg-white" />
        <div
          className="absolute h-4 w-4 rounded-full border-[3px] border-primary bg-white shadow-sm"
          style={{
            left: `${50 + 42 * Math.sin(knobAngle)}%`,
            top: `${50 - 42 * Math.cos(knobAngle)}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
          <strong className="text-2xl font-bold text-foreground">
            {value}
          </strong>
          <span className="text-[11px] text-muted-foreground">문항</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        드래그 또는 방향키
      </p>
    </div>
  );
}

const templates: Record<QuestionType, Omit<ExamQuestion, "id">[]> = {
  ox: [
    {
      type: "ox",
      unit: "약물동태학",
      prompt: "반감기가 길어질수록 정상상태에 도달하는 시간도 길어진다.",
      answer: "O",
      explanation:
        "정상상태 도달에는 일반적으로 약 4~5회의 반감기가 필요합니다.",
    },
    {
      type: "ox",
      unit: "자율신경계",
      prompt: "아트로핀은 무스카린 수용체 효능제이다.",
      answer: "X",
      explanation: "아트로핀은 무스카린 수용체 길항제입니다.",
    },
  ],
  choice: [
    {
      type: "choice",
      unit: "심혈관계",
      prompt: "ACE 억제제의 대표적인 이상반응은?",
      choices: ["마른기침", "저혈당", "변비", "시야 흐림"],
      answer: "마른기침",
      explanation: "브래디키닌 축적으로 마른기침이 나타날 수 있습니다.",
    },
    {
      type: "choice",
      unit: "항균제",
      prompt: "세포벽 합성을 억제하는 항생제는?",
      choices: ["페니실린", "아지트로마이신", "겐타마이신", "시프로플록사신"],
      answer: "페니실린",
      explanation: "페니실린은 PBP에 결합해 세포벽 합성을 억제합니다.",
    },
    {
      type: "choice",
      unit: "제제학",
      prompt: "정제의 붕해를 촉진하는 첨가제는?",
      choices: ["붕해제", "결합제", "활택제", "착색제"],
      answer: "붕해제",
      explanation: "붕해제는 정제가 작은 입자로 빠르게 분산되도록 돕습니다.",
    },
  ],
  essay: [
    {
      type: "essay",
      unit: "수용체 약리학",
      prompt:
        "경쟁적 길항제가 효능제의 용량-반응 곡선에 미치는 영향을 설명하세요.",
      answer:
        "수용체 결합을 경쟁적으로 방해하여 곡선을 우측 이동시키지만 최대효과는 유지된다.",
      keywords: ["경쟁", "우측 이동", "최대효과"],
      explanation:
        "경쟁적 길항은 효능제 농도를 높여 극복할 수 있어 Emax는 유지됩니다.",
    },
  ],
};

function makeQuestions(counts: Record<QuestionType, number>) {
  return (Object.keys(counts) as QuestionType[]).flatMap((type) =>
    Array.from({ length: counts[type] }, (_, index) => ({
      ...templates[type][index % templates[type].length],
      id: `${type}-${index + 1}`,
    })),
  );
}

export default function SchoolExamPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"setup" | "exam" | "result">("setup");
  const [activeTab, setActiveTab] = useState<ExamTab>("generate");
  const [subject, setSubject] = useState("약리학 중간고사");
  const [difficulty, setDifficulty] = useState<Difficulty>("중");
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    ox: 2,
    choice: 3,
    essay: 1,
  });
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [resultOrigin, setResultOrigin] = useState<"online" | "photo">(
    "online",
  );

  const total = counts.ox + counts.choice + counts.essay;
  const answeredCount = examQuestions.filter((question) =>
    answers[question.id]?.trim(),
  ).length;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pillchat:school-exam-draft");
      if (raw) setAnswers(JSON.parse(raw) as Record<string, string>);
    } catch {
      window.localStorage.removeItem("pillchat:school-exam-draft");
    }
  }, []);

  useEffect(() => {
    if (stage === "exam") {
      window.localStorage.setItem(
        "pillchat:school-exam-draft",
        JSON.stringify(answers),
      );
    }
  }, [answers, stage]);

  const validateFile = (
    file: File | null,
    setter: (file: File | null) => void,
  ) => {
    if (file && file.size > 20 * 1024 * 1024) {
      setFileError("파일은 20MB 이하만 업로드할 수 있어요.");
      setter(null);
      return;
    }
    setFileError("");
    setter(file);
  };

  const startExam = () => {
    setExamQuestions(makeQuestions(counts));
    setAnswers({});
    setStage("exam");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitExam = () => {
    setShowSubmit(false);
    setResultOrigin("online");
    setStage("result");
    window.localStorage.removeItem("pillchat:school-exam-draft");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gradePhoto = () => {
    if (!answerImage) return;
    const sample = makeQuestions(counts);
    setExamQuestions(sample);
    setAnswers(
      Object.fromEntries(
        sample.map((question, index) => [
          question.id,
          index === 1 ? "확인 불가" : question.answer,
        ]),
      ),
    );
    setResultOrigin("photo");
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const result = useMemo(() => {
    const details = examQuestions.map((question) => {
      const userAnswer = answers[question.id]?.trim() ?? "";
      if (question.type === "essay") {
        const matched = (question.keywords ?? []).filter((keyword) =>
          userAnswer.includes(keyword),
        );
        return {
          question,
          userAnswer,
          correct: matched.length === (question.keywords?.length ?? 0),
          matched,
          missed: (question.keywords ?? []).filter(
            (keyword) => !matched.includes(keyword),
          ),
        };
      }
      return {
        question,
        userAnswer,
        correct: userAnswer === question.answer,
        matched: [] as string[],
        missed: [] as string[],
      };
    });
    const score = details.length
      ? Math.round(
          (details.filter((detail) => detail.correct).length / details.length) *
            100,
        )
      : 0;
    return { details, score };
  }, [answers, examQuestions]);

  const grade =
    result.score >= 95
      ? "A+"
      : result.score >= 85
        ? "A"
        : result.score >= 75
          ? "B+"
          : result.score >= 65
            ? "C+"
            : result.score >= 55
              ? "D"
              : "F";
  const topPercent = Math.max(3, Math.round((100 - result.score) * 0.8 + 5));

  return (
    <AppShell className="min-h-dvh bg-gray-50 print:max-w-none print:bg-white print:pb-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 print:hidden">
        <button
          type="button"
          onClick={() =>
            stage === "setup" ? router.push("/questionbank") : setStage("setup")
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="이전 화면"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">학교 시험지 학습</p>
          <p className="text-xs text-muted-foreground">
            생성 · 풀이 · 채점 · 분석
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      </header>

      {stage === "setup" && (
        <main className="px-5 py-7 md:px-10 md:py-9">
          <h1 className="text-2xl font-bold text-foreground md:text-[1.75rem]">
            시험지를 어떻게 준비할까요?
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            온라인 시험지를 만들거나 인쇄해서 푼 답안을 채점할 수 있어요.
          </p>

          <div
            className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "generate"}
              onClick={() => setActiveTab("generate")}
              className={`h-11 rounded-lg text-sm font-bold ${
                activeTab === "generate"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              시험지 생성
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "grade"}
              onClick={() => setActiveTab("grade")}
              className={`h-11 rounded-lg text-sm font-bold ${
                activeTab === "grade"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              인쇄 시험지 채점
            </button>
          </div>

          {activeTab === "generate" ? (
            <div className="mt-6 space-y-5">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <label
                  htmlFor="subject"
                  className="text-sm font-bold text-foreground"
                >
                  과목명
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="예: 약리학 중간고사"
                  className="mt-3 h-12 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-primary"
                />
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">
                    문항 구성
                  </h2>
                  <p className="text-sm font-bold text-primary">
                    총 {total}문항
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <QuestionDial
                    title="OX"
                    value={counts.ox}
                    max={10}
                    onChange={(value) => setCounts({ ...counts, ox: value })}
                  />
                  <QuestionDial
                    title="객관식"
                    value={counts.choice}
                    max={10}
                    onChange={(value) =>
                      setCounts({ ...counts, choice: value })
                    }
                  />
                  <QuestionDial
                    title="서술형"
                    value={counts.essay}
                    max={5}
                    onChange={(value) => setCounts({ ...counts, essay: value })}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground">난이도</h2>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(["하", "중", "상", "최상"] as Difficulty[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDifficulty(item)}
                      className={`h-10 rounded-lg border text-sm font-semibold ${
                        difficulty === item
                          ? "border-primary bg-brandSecondary text-primary"
                          : "border-gray-200 text-muted-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center">
                <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
                <span className="mt-3 text-sm font-bold text-foreground">
                  {sourceFile ? sourceFile.name : "강의자료 업로드"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  PDF, 텍스트, 이미지 · 최대 20MB
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,image/*"
                  className="sr-only"
                  onChange={(event) =>
                    validateFile(event.target.files?.[0] ?? null, setSourceFile)
                  }
                />
              </label>
              {fileError && (
                <p className="text-sm font-medium text-red-500">{fileError}</p>
              )}

              <button
                type="button"
                onClick={startExam}
                disabled={!subject.trim() || total === 0}
                className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white disabled:bg-gray-300"
              >
                온라인 시험지 만들기
              </button>
              {!sourceFile && (
                <p className="text-center text-xs text-muted-foreground">
                  자료 없이 시작하면 검수용 샘플 문항으로 생성됩니다.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                <ImageIcon
                  className="h-9 w-9 text-primary"
                  aria-hidden="true"
                />
                <span className="mt-4 text-base font-bold text-foreground">
                  {answerImage
                    ? answerImage.name
                    : "푼 시험지 사진을 올려주세요"}
                </span>
                <span className="mt-2 text-sm text-muted-foreground">
                  선명하게 촬영한 JPG, PNG 이미지 · 최대 20MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    validateFile(
                      event.target.files?.[0] ?? null,
                      setAnswerImage,
                    )
                  }
                />
              </label>
              {fileError && (
                <p className="mt-3 text-sm font-medium text-red-500">
                  {fileError}
                </p>
              )}
              <button
                type="button"
                onClick={gradePhoto}
                disabled={!answerImage}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white disabled:bg-gray-300"
              >
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                채점 시작
              </button>
            </div>
          )}
        </main>
      )}

      {stage === "exam" && (
        <main className="px-5 py-7 md:px-10 md:py-9 print:px-8">
          <div className="flex items-start justify-between gap-4 border-b-2 border-foreground pb-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                난이도 {difficulty}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">
                {subject}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                총 {examQuestions.length}문항
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-foreground print:hidden"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              PDF 저장
            </button>
          </div>

          <div className="mt-7 space-y-7">
            {examQuestions.map((question, index) => (
              <section
                key={question.id}
                className="break-inside-avoid rounded-xl border border-gray-200 bg-white p-5 print:border-0 print:p-0"
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-primary">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {question.unit}
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {question.type === "ox"
                          ? "OX"
                          : question.type === "choice"
                            ? "4지선다"
                            : "서술형"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                      {question.prompt}
                    </p>

                    {question.type === "ox" && (
                      <div className="mt-4 grid max-w-xs grid-cols-2 gap-2 print:hidden">
                        {["O", "X"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setAnswers({ ...answers, [question.id]: value })
                            }
                            className={`h-12 rounded-xl border text-base font-bold ${
                              answers[question.id] === value
                                ? "border-primary bg-brandSecondary text-primary"
                                : "border-gray-300 text-muted-foreground"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    )}

                    {question.type === "choice" && (
                      <div className="mt-4 space-y-2">
                        {question.choices?.map((choice, choiceIndex) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() =>
                              setAnswers({ ...answers, [question.id]: choice })
                            }
                            className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm print:border-0 print:p-0 ${
                              answers[question.id] === choice
                                ? "border-primary bg-brandSecondary text-foreground"
                                : "border-gray-200 text-foreground"
                            }`}
                          >
                            <span className="font-semibold">
                              {choiceIndex + 1}
                            </span>
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}

                    {question.type === "essay" && (
                      <textarea
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          setAnswers({
                            ...answers,
                            [question.id]: event.target.value,
                          })
                        }
                        placeholder="답안을 작성하세요."
                        rows={5}
                        className="mt-4 w-full resize-none rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary print:min-h-32 print:placeholder:text-transparent"
                      />
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="sticky bottom-[calc(var(--bottom-nav-height)+0.75rem)] mt-8 rounded-xl border border-gray-200 bg-white p-3 shadow-lg print:hidden">
            <div className="mb-2 flex items-center justify-between text-xs">
              <p className="font-semibold text-muted-foreground">
                {answeredCount}/{examQuestions.length} 문항 작성 완료
              </p>
              <p className="font-bold text-primary">
                {Math.round(
                  (answeredCount / Math.max(examQuestions.length, 1)) * 100,
                )}
                %
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmit(true)}
              className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white"
            >
              제출하기
            </button>
          </div>
        </main>
      )}

      {stage === "result" && (
        <main className="px-5 py-8 md:px-10 md:py-10">
          <section className="rounded-2xl bg-foreground px-5 py-6 text-white md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/70">
                  {resultOrigin === "photo"
                    ? "인쇄 시험지 채점 완료"
                    : "온라인 시험 제출 완료"}
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {result.score}
                  <span className="text-lg text-white/60"> / 100</span>
                </p>
              </div>
              <BarChart3 className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
              <p>
                예상 학점 <strong className="ml-1 text-primary">{grade}</strong>
              </p>
              <p>
                상위{" "}
                <strong className="ml-1 text-primary">{topPercent}%</strong>
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              단원별 개념 완성도
            </h2>
            <div className="mt-4 space-y-4">
              {[...new Set(examQuestions.map((question) => question.unit))].map(
                (unit) => {
                  const unitDetails = result.details.filter(
                    (detail) => detail.question.unit === unit,
                  );
                  const percent = Math.round(
                    (unitDetails.filter((detail) => detail.correct).length /
                      unitDetails.length) *
                      100,
                  );
                  return (
                    <div key={unit}>
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-foreground">{unit}</p>
                        <p className="font-bold text-primary">{percent}%</p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <section className="mt-5 space-y-3">
            <h2 className="text-base font-bold text-foreground">문항별 분석</h2>
            {result.details.map((detail, index) => (
              <article
                key={detail.question.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${detail.correct ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}
                  >
                    {detail.correct ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {index + 1}. {detail.question.prompt}
                    </p>
                    <div className="mt-3 space-y-1 text-xs leading-5 text-muted-foreground">
                      <p>
                        내 답:{" "}
                        <strong className="text-foreground">
                          {detail.userAnswer || "미작성"}
                        </strong>
                      </p>
                      <p>
                        정답:{" "}
                        <strong className="text-green-700">
                          {detail.question.answer}
                        </strong>
                      </p>
                      {detail.question.type === "essay" && (
                        <>
                          <p>
                            맞힌 키워드: {detail.matched.join(", ") || "없음"}
                          </p>
                          <p className="text-red-500">
                            놓친 키워드: {detail.missed.join(", ") || "없음"}
                          </p>
                        </>
                      )}
                      <p className="pt-1">{detail.question.explanation}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setStage("exam");
              }}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-foreground"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              다시 풀기
            </button>
            <button
              type="button"
              onClick={() => setStage("setup")}
              className="flex h-12 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-bold text-white"
            >
              새 시험지
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </main>
      )}

      {showSubmit && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="submit-title" className="text-lg font-bold text-foreground">
              시험지를 제출할까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {examQuestions.length - answeredCount > 0
                ? `아직 ${examQuestions.length - answeredCount}개 문항이 비어있습니다. 제출 후에는 답안을 수정할 수 없어요.`
                : "모든 문항을 작성했습니다. 제출하면 바로 채점 결과를 확인할 수 있어요."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSubmit(false)}
                className="h-11 rounded-xl border border-gray-300 text-sm font-bold text-foreground"
              >
                계속 풀기
              </button>
              <button
                type="button"
                onClick={submitExam}
                className="h-11 rounded-xl bg-primary text-sm font-bold text-white"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
